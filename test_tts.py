import requests
import wave

# Define the request
url = "http://localhost:5000/synthesize"
headers = {"Content-Type": "application/json"}
data = {"text": "Hello, this is a test of Moshi's TTS service."}

# Send the request
response = requests.post(url, json=data, headers=headers)

# Check if successful
if response.status_code == 200:
    with open("test_output.wav", "wb") as f:
        f.write(response.content)
    
    # Verify file
    with wave.open("test_output.wav", "rb") as wf:
        print(f"Channels: {wf.getnchannels()}")
        print(f"Sample width: {wf.getsampwidth()}")
        print(f"Frame rate: {wf.getframerate()}")
        print(f"Number of frames: {wf.getnframes()}")
    print("Test audio saved to 'test_output.wav'")
else:
    print(f"Failed with status code: {response.status_code}")
    print(f"Response: {response.text}")
