import os
import io
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from gtts import gTTS
from io import BytesIO

app = Flask(__name__)
CORS(app)

class GoogleTTSClient:
    def __init__(self):
        print("Initializing Google TTS client...")
        print("Google TTS client initialized!")
        
    def synthesize_stream(self, text, voice_id="default"):
        """Stream audio synthesis using Google TTS"""
        try:
            # Map voice_id to language and slow parameter
            lang_map = {
                'default': ('en', False),
                'male': ('en', True), 
                'female': ('en', False),
                'slow': ('en', False),
                'fast': ('en', True)
            }
            
            lang, slow = lang_map.get(voice_id, ('en', False))
            
            print(f"Generating speech for text: '{text[:50]}...', language: {lang}, slow: {slow}")
            
            # Create gTTS object
            tts = gTTS(text=text, lang=lang, slow=slow)
            
            # Save to BytesIO buffer
            audio_buffer = BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Stream the audio data in chunks
            while True:
                chunk = audio_buffer.read(1024)
                if not chunk:
                    break
                yield chunk
                
        except Exception as e:
            raise Exception(f"Google TTS Error: {str(e)}")

# Initialize Google TTS client
print("Initializing Google TTS client...")
tts_client = GoogleTTSClient()

@app.route('/')
def index():
    return jsonify({
        'message': 'Google TTS Server is running!',
        'endpoints': {
            'POST /synthesize': 'Generate speech from text (JSON: {"text": "...", "voice_id": "..."})',
            'GET /synthesize?text=...&voice_id=...': 'Generate speech from URL parameters (for testing)',
            'GET /health': 'Check server health',
            'POST /synthesize-batch': 'Non-streaming synthesis'
        },
        'usage': 'Open tts_client.html in your browser for a web interface'
    })

@app.route('/favicon.ico')
def favicon():
    return '', 204  # Return empty response with no content status

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Google TTS Server'})

@app.route('/synthesize', methods=['GET', 'POST', 'OPTIONS'])
def synthesize():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    print(f"Received {request.method} request to /synthesize")
    print(f"Content-Type: {request.content_type}")
    print(f"Request data: {request.get_data()}")
    
    try:
        # Handle GET requests (for testing)
        if request.method == 'GET':
            text = request.args.get('text', 'Hello, this is a test from Moshi TTS.')
            voice_id = request.args.get('voice_id', 'default')
        else:
            # Handle POST requests
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400
                
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400
                
            if 'text' not in data:
                return jsonify({'error': 'Text field is required'}), 400
                
            text = data['text']
            voice_id = data.get('voice_id', 'default')
        
        if not text.strip():
            return jsonify({'error': 'Text cannot be empty'}), 400
            
        print(f"Processing TTS request: text='{text[:50]}...', voice_id='{voice_id}'")
            
        # Collect all audio data first instead of streaming
        try:
            audio_chunks = []
            for chunk in tts_client.synthesize_stream(text, voice_id):
                if chunk:  # Only add non-empty chunks
                    audio_chunks.append(chunk)
            
            if not audio_chunks:
                return jsonify({'error': 'No audio data generated'}), 500
                
            audio_data = b''.join(audio_chunks)
            print(f"Generated audio data size: {len(audio_data)} bytes")
            
            if len(audio_data) == 0:
                return jsonify({'error': 'Empty audio file generated'}), 500
                
        except Exception as e:
            print(f"Audio generation error: {e}")
            return jsonify({'error': f'Audio generation failed: {str(e)}'}), 500
        
        # Handle range requests for better browser compatibility
        range_header = request.headers.get('Range', None)
        if range_header:
            byte_start = 0
            byte_end = len(audio_data) - 1
            
            # Parse range header
            if range_header.startswith('bytes='):
                range_match = range_header[6:].split('-')
                if range_match[0]:
                    byte_start = int(range_match[0])
                if range_match[1]:
                    byte_end = int(range_match[1])
            
            # Ensure valid range
            byte_start = max(0, byte_start)
            byte_end = min(len(audio_data) - 1, byte_end)
            
            if byte_start > byte_end:
                return Response(status=416)  # Range Not Satisfiable
            
            content = audio_data[byte_start:byte_end + 1]
            
            return Response(
                content,
                status=206,  # Partial Content
                headers={
                    'Content-Type': 'audio/wav',
                    'Accept-Ranges': 'bytes',
                    'Content-Range': f'bytes {byte_start}-{byte_end}/{len(audio_data)}',
                    'Content-Length': str(len(content)),
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            )
        else:
            # Return full audio file
            return Response(
                audio_data,
                mimetype='audio/wav',
                headers={
                    'Content-Disposition': 'inline; filename="speech.wav"',
                    'Content-Length': str(len(audio_data)),
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-cache'
                }
            )
        
    except Exception as e:
        print(f"Error in synthesize endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/synthesize-batch', methods=['POST'])
def synthesize_batch():
    """Non-streaming synthesis for smaller texts"""
    try:
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
            
        text = data['text']
        voice_id = data.get('voice_id', 'default')
        
        # Collect all chunks into memory (for smaller texts)
        audio_chunks = []
        for chunk in tts_client.synthesize_stream(text, voice_id):
            audio_chunks.append(chunk)
            
        audio_data = b''.join(audio_chunks)
        
        return Response(
            audio_data,
            mimetype='audio/wav',
            headers={'Content-Disposition': 'inline; filename="speech.wav"'}
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Google TTS Server on port {port}")
    print("No API key required - using Google TTS service")
    app.run(host='0.0.0.0', port=port, debug=True)
