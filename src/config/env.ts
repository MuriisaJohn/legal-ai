export function getGeminiApiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function hasGeminiApiKey(): boolean {
  return !!getGeminiApiKey();
}
