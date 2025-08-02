// Re-export all functions from the frontend services
export * from '../frontend/services/kyutaiTTSService';

// Import and re-export the main function for backwards compatibility
import { kyutaiTTS as _kyutaiTTS } from '../frontend/services/kyutaiTTSService';

export const kyutaiTTS = _kyutaiTTS;
