from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import os

app = Flask(__name__)

# Route 1: This serves the main HTML page to the browser
@app.route('/')
def index():
    return render_template('index.html')

# Route 2: This acts as our API to process uploaded .wav files
@app.route('/process_audio', methods=['POST'])
def process_audio():
    # Check if a file was actually sent
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'})

    if file:
        # Save the file temporarily
        temp_path = "temp_" + file.filename
        file.save(temp_path)

        # Run the AI Transcription
        recognizer = sr.Recognizer()
        try:
            with sr.AudioFile(temp_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
                
            # Clean up the file and return the text
            os.remove(temp_path)
            return jsonify({'success': True, 'text': text})
            
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    # Starts the local development server
    app.run(debug=True, port=5000)