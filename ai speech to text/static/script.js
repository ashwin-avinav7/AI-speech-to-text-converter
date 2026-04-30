// --- UTILITY FUNCTIONS ---
function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function countWords(str) {
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// --- TAB SWITCHING LOGIC ---
function showTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
}

// --- MODULE 1: REAL-TIME ---
const startBtn = document.getElementById('start_button');
const finalSpan = document.getElementById('final_span');
const interimSpan = document.getElementById('interim_span');
const liveWordCount = document.getElementById('live_word_count');
const downloadLiveBtn = document.getElementById('download_live');
const micStatus = document.getElementById('mic_status');

let recognizing = false;
let final_transcript = '';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function() {
        recognizing = true;
        // Trigger the red pulsing animation via CSS class
        startBtn.classList.add('recording');
        micStatus.innerText = '🔴 Listening... Speak now';
        micStatus.style.color = '#ef4444';
        downloadLiveBtn.style.display = 'none';
    };

    recognition.onresult = function(event) {
        let interim_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        finalSpan.innerHTML = final_transcript;
        interimSpan.innerHTML = interim_transcript;
        
        liveWordCount.innerHTML = 'Words: ' + countWords(final_transcript + " " + interim_transcript);
    };

    recognition.onend = function() {
        recognizing = false;
        // Remove animation and reset status
        startBtn.classList.remove('recording');
        micStatus.innerText = 'System Ready';
        micStatus.style.color = '#64748b';
        
        if (final_transcript.trim().length > 0) {
            downloadLiveBtn.style.display = 'block';
        }
    };

    startBtn.onclick = function() {
        if (recognizing) {
            recognition.stop();
            return;
        }
        final_transcript = '';
        recognition.lang = 'en-US';
        recognition.start();
        finalSpan.innerHTML = '';
        interimSpan.innerHTML = '';
        liveWordCount.innerHTML = 'Words: 0';
    };

    downloadLiveBtn.onclick = function() {
        downloadText(final_transcript, 'Live_Transcript.txt');
    };

} else {
    document.querySelector('.mic-wrapper').innerHTML = "<span style='color:#ef4444'>Browser not supported. Use Google Chrome or Edge.</span>";
}

// --- MODULE 2: FILE UPLOAD ---
const uploadBtn = document.getElementById('upload_button');
const audioFile = document.getElementById('audio_file');
const batchResults = document.getElementById('batch_results');
const batchWordCount = document.getElementById('batch_word_count');
const downloadBatchBtn = document.getElementById('download_batch');
const fileMsg = document.querySelector('.file-msg');
let batchTranscript = '';

// Update text when file is selected
audioFile.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        fileMsg.innerText = "Selected: " + this.files[0].name;
        fileMsg.style.color = '#06b6d4';
    } else {
        fileMsg.innerText = "Drag & Drop or Click to Select .WAV File";
        fileMsg.style.color = '#94a3b8';
    }
});

uploadBtn.onclick = async function() {
    const file = audioFile.files[0];
    if (!file) {
        alert("Please select a .wav file first.");
        return;
    }

    batchResults.style.display = 'block';
    batchResults.innerHTML = "<span class='interim'>Processing neural algorithms... please wait.</span>";
    batchWordCount.style.display = 'none';
    downloadBatchBtn.style.display = 'none';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/process_audio', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            batchTranscript = data.text;
            batchResults.innerHTML = `<span class="final">${batchTranscript}</span>`;
            
            batchWordCount.innerHTML = 'Words: ' + countWords(batchTranscript);
            batchWordCount.style.display = 'inline-block';
            downloadBatchBtn.style.display = 'block';
        } else {
            batchResults.innerHTML = `<span style="color:#ef4444">Error: ${data.error}</span>`;
        }
    } catch (error) {
        batchResults.innerHTML = `<span style="color:#ef4444">System Failure: Could not connect to server.</span>`;
    }
};

downloadBatchBtn.onclick = function() {
    downloadText(batchTranscript, 'File_Transcript.txt');
};