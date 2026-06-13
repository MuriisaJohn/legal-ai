import { Routes, Route } from "react-router-dom";
import { Providers } from "./providers";
import { ROUTES } from "@/routes";

import IndexPage from "@/features/landing/pages/IndexPage";
import ChatPage from "@/features/chat/pages/ChatPage";
import DocumentsPage from "@/features/documents/pages/DocumentsPage";
import VoiceModePage from "@/features/voice/pages/VoiceModePage";
import AboutPage from "@/features/landing/pages/AboutPage";
import NotFoundPage from "@/features/landing/pages/NotFoundPage";

const App = () => (
  <Providers>
    <Routes>
      <Route path={ROUTES.HOME} element={<IndexPage />} />
      <Route path={ROUTES.DOCUMENTS} element={<DocumentsPage />} />
      <Route path={ROUTES.CHAT} element={<ChatPage />} />
      <Route path={ROUTES.VOICE} element={<VoiceModePage />} />
      <Route path={ROUTES.ABOUT} element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Providers>
);

export default App;
