# LegalAI Assistant

LegalAI Assistant is a comprehensive, AI-powered platform designed to provide accurate legal research, document analysis, and tailored legal guidance. It empowers both legal professionals and citizens to better understand legal rights and obligations through advanced AI processing and domain-specific expertise.

## 🚀 Key Features

- **Multi-Country Legal Analysis:** Users can select specific jurisdictions to receive localized legal advice tailored to regional laws and regulations.
- **Advanced Document Processing:**
  - **PDF & DOCX Analysis:** Upload and analyze legal documents to extract key insights.
  - **OCR Support:** Integrated Tesseract.js for extracting text from images and scanned documents.
- **AI-Powered Chat Interface:** Dynamic chat environment using state-of-the-art models via Gemini.
- **Voice Mode & TTS:**
  - **Interactive Voice Chat:** Talk to the AI and receive spoken responses.
  - **Text-to-Speech (TTS):** Integrated support for ElevenLabs and a custom Google TTS local server.
- **Enterprise-Grade Security:** Protocols ensuring confidentiality and compliance with legal data standards.
- **Modern Responsive UI:** Built with shadcn/ui and Tailwind CSS for a seamless experience across all devices.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management:** Zustand
- **AI Integration:** Gemini API
- **Document Extraction:** PDF.js, Mammoth (DOCX), Tesseract.js (OCR)
- **Visualization:** Three.js (for Audio Visualizers)
- **Backend (TTS):** Python, Flask, gTTS

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Python 3.8+](https://www.python.org/) (optional, for local TTS server)

## ⚙️ Getting Started

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
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. (Optional) Setup Local TTS Server
If you wish to use the local Google TTS service:
```bash
# Install Python dependencies
pip install -r tts_requirements.txt

# Start the TTS server
python tts_server.py
```

### 5. Run the Application
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🤖 AI Configuration

You can customize the AI model used by the application:
1. Open `src/frontend/services/geminiService.ts`.
2. Locate the model configuration (defaulting to `gemini-1.5-flash`).
3. Replace the model identifier with your preferred model (e.g., `gemini-1.5-pro`).

## 📂 Project Structure

- `src/frontend/components/`: Reusable UI components.
- `src/frontend/pages/`: Main application views (Chat, VoiceMode, Documents, etc.).
- `src/frontend/services/`: API integration services (Gemini, TTS, etc.).
- `src/utils/`: Utility functions for file parsing and data processing.
- `tts_server.py`: Python-based Flask server for Google TTS functionality.

## 🛡️ Security & Privacy

LegalAI processes documents with a focus on security. While the `.env` file might be present in some development environments, it is recommended to use secrets management in production and never commit sensitive keys to public repositories.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for suggestions and bug reports.


