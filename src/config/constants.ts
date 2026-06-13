export const JURISDICTIONS = [
  { code: 'UG', name: 'Uganda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
] as const;

export const API = {
  MOSHI_TTS_BASE_URL: 'http://localhost:5000',
} as const;

export const UI = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_CONVERSATION_HISTORY: 20,
  STREAMING_CHUNK_DELAY: 30,
} as const;
