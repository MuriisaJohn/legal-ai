import os
import io
import torch
import numpy as np
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import soundfile as sf
import tempfile
import subprocess
import json
from pathlib import Path
try:
    import ffmpeg
    FFMPEG_AVAILABLE = True
except ImportError:
    FFMPEG_AVAILABLE = False
    print("Warning: ffmpeg-python not available. Install with: pip install ffmpeg-python")

app = Flask(__name__)
CORS(app)

class MoshiTTSClient:
    def __init__(self):
        print("Initializing Moshi TTS client...")
        self.temp_dir = Path(tempfile.gettempdir()) / "moshi_tts"
        self.temp_dir.mkdir(exist_ok=True)
        print("Moshi TTS client initialized!")
        
    def synthesize_stream(self, text, voice_id="default"):
        """Stream audio synthesis using Moshi voice model"""
        try:
            # Create temporary files
            input_file = self.temp_dir / f"input_{hash(text)}.jsonl"
            output_dir = self.temp_dir / f"output_{hash(text)}"
            output_dir.mkdir(exist_ok=True)
            
            # Create TTS request in JSONL format
            tts_request = {
                "turns": [text],
                "voices": [voice_id],
                "id": "synthesis"
            }
            
            # Write the request to JSONL file
            with open(input_file, 'w') as f:
                f.write(json.dumps(tts_request) + '\n')
            
            # Run Moshi TTS with audio-only output
            cmd = [
                "python", "-m", "moshi.run_tts",
                "--input", str(input_file),
                "--output-dir", str(output_dir),
                "--model", "kyutai/moshiko-pytorch-bf16",
                "--device", "cpu",  # Use CPU for compatibility
                "--audio-only"  # Generate only audio, no video
            ]
            
            print(f"Running TTS command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                print(f"TTS stderr: {result.stderr}")
                print(f"TTS stdout: {result.stdout}")
                # Try without --audio-only flag if it's not supported
                cmd_fallback = [
                    "python", "-m", "moshi.run_tts",
                    "--input", str(input_file),
                    "--output-dir", str(output_dir),
                    "--model", "kyutai/moshiko-pytorch-bf16",
                    "--device", "cpu"
                ]
                print(f"Trying fallback command: {' '.join(cmd_fallback)}")
                result = subprocess.run(cmd_fallback, capture_output=True, text=True, timeout=60)
                
                if result.returncode != 0:
                    raise Exception(f"TTS generation failed: {result.stderr}")
            
            # Find the generated file (audio or video)
            audio_file = None
            video_file = None
            
            # First, look for direct audio files
            for ext in ['wav', 'mp3', 'flac', 'm4a']:
                potential_file = output_dir / f"synthesis.{ext}"
                if potential_file.exists():
                    audio_file = potential_file
                    break
            
            # If no audio file found, look for video files to extract audio from
            if not audio_file:
                for ext in ['mp4', 'webm', 'mkv', 'avi']:
                    potential_file = output_dir / f"synthesis.{ext}"
                    if potential_file.exists():
                        video_file = potential_file
                        break
            
            # If we found a video file, extract audio from it
            if video_file and not audio_file:
                print(f"Found video file: {video_file}, extracting audio...")
                audio_file = output_dir / "synthesis_audio.wav"
                
                if FFMPEG_AVAILABLE:
                    try:
                        # Use ffmpeg-python to extract audio
                        (
                            ffmpeg
                            .input(str(video_file))
                            .output(str(audio_file), acodec='pcm_s16le', ac=1, ar='16000')
                            .overwrite_output()
                            .run(quiet=True)
                        )
                        print(f"Audio extracted to: {audio_file}")
                    except Exception as e:
                        print(f"FFmpeg extraction failed: {e}")
                        audio_file = None
                else:
                    # Fallback: use subprocess to call ffmpeg directly
                    try:
                        cmd_extract = [
                            'ffmpeg', '-i', str(video_file), 
                            '-vn', '-acodec', 'pcm_s16le', 
                            '-ar', '16000', '-ac', '1', 
                            str(audio_file), '-y'
                        ]
                        result = subprocess.run(cmd_extract, capture_output=True, text=True)
                        if result.returncode == 0:
                            print(f"Audio extracted to: {audio_file}")
                        else:
                            print(f"FFmpeg extraction failed: {result.stderr}")
                            audio_file = None
                    except Exception as e:
                        print(f"FFmpeg extraction failed: {e}")
                        audio_file = None
            
            if not audio_file or not audio_file.exists():
                # List all files in output directory for debugging
                files = list(output_dir.glob('*'))
                print(f"Files in output directory: {files}")
                raise Exception("No audio file found or could be extracted")
            
            # Stream the audio file
            with open(audio_file, 'rb') as f:
                while True:
                    chunk = f.read(1024)
                    if not chunk:
                        break
                    yield chunk
            
            # Cleanup
            try:
                input_file.unlink(missing_ok=True)
                audio_file.unlink(missing_ok=True)
                # Remove other generated files
                for file in output_dir.glob("synthesis.*"):
                    file.unlink(missing_ok=True)
                output_dir.rmdir()
            except Exception as e:
                print(f"Cleanup warning: {e}")
                
        except Exception as e:
            raise Exception(f"Moshi TTS Error: {str(e)}")

# Initialize Moshi TTS client
print("Initializing Moshi TTS client...")
moshi_client = MoshiTTSClient()

@app.route('/')
def index():
    return jsonify({
        'message': 'Moshi TTS Server is running!',
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
    return jsonify({'status': 'healthy', 'service': 'Moshi TTS Server'})

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
            
        def generate_audio():
            try:
                for chunk in moshi_client.synthesize_stream(text, voice_id):
                    yield chunk
            except Exception as e:
                print(f"Streaming error: {e}")
                yield b''
        
        return Response(
            generate_audio(),
            mimetype='audio/wav',
            headers={
                'Content-Disposition': 'inline; filename="speech.wav"',
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*'
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
        for chunk in moshi_client.synthesize_stream(text, voice_id):
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
    print(f"Starting Moshi TTS Server on port {port}")
    print("Make sure to set MOSHI_API_KEY environment variable")
    app.run(host='0.0.0.0', port=port, debug=True)
