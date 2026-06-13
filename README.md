# LegalAI Assistant

LegalAI Assistant is a comprehensive, AI-powered platform designed to provide accurate legal research, document analysis, and tailored legal guidance. It empowers both legal professionals and citizens to better understand legal rights and obligations through advanced AI processing and domain-specific expertise.

## Key Features

- **Multi-Country Legal Analysis:** Users can select specific jurisdictions to receive localized legal advice tailored to regional laws and regulations.
- **Advanced Document Processing:**
  - **PDF & DOCX Analysis:** Upload and analyze legal documents to extract key insights.
  - **OCR Support:** Integrated Tesseract.js for extracting text from images and scanned documents.
- **AI-Powered Chat Interface:** Dynamic chat environment using Gemini 3.5 Flash via the v1beta API (supports system instructions).
- **Voice Mode & TTS:**
  - **Interactive Voice Chat:** Talk to the AI via browser SpeechRecognition and receive spoken responses.
  - **Streaming Speech:** AI responses are spoken incrementally as they arrive (low-latency SpeechSynthesis), with high-quality full playback via the local TTS server on completion.
  - **Voice Selection:** Choose from available system voices via the in-app voice picker.
  - **Text-to-Speech (TTS):** Local Google TTS server (Flask/gTTS) for full-response playback, with automatic fallback to browser SpeechSynthesis.
- **Enterprise-Grade Security:** Protocols ensuring confidentiality and compliance with legal data standards.
- **Modern Responsive UI:** Built with shadcn/ui and Tailwind CSS, warm cream + deep navy palette, Plus Jakarta Sans + Libre Baskerville typography.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management:** Zustand (with localStorage persistence)
- **AI Integration:** Gemini API (v1beta, model `gemini-3.5-flash`)
- **Document Extraction:** PDF.js, Mammoth (DOCX), Tesseract.js (OCR)
- **Visualization:** Three.js (audio visualizer)
- **Backend (TTS):** Python, Flask, gTTS

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Python 3.8+](https://www.python.org/) (optional, for local TTS server)

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd legalAI
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Application

**Option A — Run both frontend and TTS server together (recommended):**
```bash
npm run dev:all
```

**Option B — Run separately in two terminals:**
```bash
# Terminal 1: Start the TTS server (requires Python)
npm run dev:tts

# Terminal 2: Start the Vite dev server
npm run dev
```

**Option C — Frontend only (TTS falls back to browser SpeechSynthesis):**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### 5. (Optional) Install Python TTS Server Dependencies
```bash
pip install -r tts_requirements.txt
```

## AI Configuration

The app uses Gemini 3.5 Flash via the v1beta endpoint. To change the model:
1. Open `src/frontend/services/geminiService.ts`.
2. Update the `model` field in the request body (default: `"gemini-3.5-flash"`).
3. The API base URL is `https://generativelanguage.googleapis.com/v1beta/models/` — change to a different version if needed.

The system instruction and jurisdiction context are injected in the voice/chat pages.

## Project Structure

- `src/frontend/components/`: Reusable UI components.
- `src/frontend/pages/`: Main application views (Chat, VoiceMode, Documents, etc.).
- `src/frontend/services/`: API integration services (Gemini, TTS, etc.).
- `src/features/voice/`: Voice mode hooks (`useSpeechRecognition`, `useVoiceStream`, `useMicrophone`) and components (`AudioVisualizer`, `VisualizerScene`).
- `src/features/chat/`: Chat stores (`chatSlice`), components, and pages.
- `src/shared/stores/`: Zustand stores (`settingsStore`, `historySlice`).
- `src/stores/`: Root store (`messageStore`) with persistence and initial greeting logic.
- `src/services/tts/`: TTS client (`MoshiTTSClient`) that talks to the local Python server.
- `tts_server.py`: Python Flask server for Google TTS (gTTS) — serves audio at `POST /synthesize`.
- `scripts/test-gemini.ts`: Standalone test suite for the Gemini API integration.

## Voice Mode Details

- **Speech Recognition:** Uses the browser's `SpeechRecognition` API (requires user gesture to start).
- **Streaming TTS:** As the AI response streams in, text is buffered into sentences and spoken immediately via `SpeechSynthesis.speak()` for low-latency audio.
- **Full Playback:** After the response completes, the full text is sent to the local TTS server (`localhost:5000`) for higher-quality audio. Falls back to SpeechSynthesis if the server is unreachable.
- **Voice Selection:** Click the voice icon in the top-right of voice mode to pick from available system voices. The selection is saved to localStorage.
- **Optimistic UI:** The mic button gives immediate visual feedback on click, independent of browser API callbacks.

## Security & Privacy

LegalAI processes documents with a focus on security. While the `.env` file might be present in some development environments, it is recommended to use secrets management in production and never commit sensitive keys to public repositories.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for suggestions and bug reports.
