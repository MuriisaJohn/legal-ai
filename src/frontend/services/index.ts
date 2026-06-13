/** Legacy adapter layer — wraps services/gemini/ and services/tts/.
 *  New code should import from @/services/gemini or @/services/tts directly. */

export { GeminiClient } from '@/services/gemini';

export { MoshiTTSClient } from '@/services/tts';
export { streamAudioFromMoshi } from './kyutaiTTSService';
export type { TTSOptions } from './kyutaiTTSService';
