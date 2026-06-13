import { GeminiClient } from '../src/services/gemini/client';

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY env var not set');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function main() {
  console.log('\n🔧 GeminiClient Test Suite');
  console.log(`   Model: gemini-3.5-flash`);
  console.log(`   API Key: ${API_KEY.slice(0, 8)}...\n`);

  // --- Test 1: validateApiKey ---
  console.log('1️⃣  validateApiKey');
  {
    const client = new GeminiClient(API_KEY);
    const result = await client.validateApiKey();
    assert(result.valid === true, `key valid: ${result.valid}${result.error ? ` (${result.error})` : ''}`);
  }

  // --- Test 2: generateResponse (non-streaming) ---
  console.log('\n2️⃣  generateResponse (non-streaming)');
  {
    const client = new GeminiClient(API_KEY);
    const response = await client.generateResponse(
      'You are a helpful assistant. Answer concisely.',
      'What is 2+2?'
    );
    assert(typeof response === 'string' && response.length > 0, `response length: ${response.length}`);
    assert(response.includes('4'), `response content: "${response.trim()}"`);
  }

  // --- Test 3: generateStreamingResponse ---
  console.log('\n3️⃣  generateStreamingResponse (streaming)');
  {
    const client = new GeminiClient(API_KEY);
    const chunks: string[] = [];
    await new Promise<void>((resolve, reject) => {
      client.generateStreamingResponse(
        'You are a helpful assistant. Answer concisely.',
        'Say hello in one word.',
        (chunk) => chunks.push(chunk),
        () => resolve(),
        (err) => reject(err)
      );
    });
    const full = chunks.join('');
    assert(chunks.length > 0, `received ${chunks.length} chunks`);
    assert(full.toLowerCase().includes('hello') || full.toLowerCase().includes('hi'),
      `stream content: "${full.trim()}"`);
  }

  // --- Test 4: 429 retry (indirect by calling rapidly) ---
  console.log('\n4️⃣  rapid calls (to test 429 resilience)');
  {
    const client = new GeminiClient(API_KEY);
    const results = await Promise.allSettled(
      Array.from({ length: 3 }, (_, i) =>
        client.generateResponse(
          'Be concise.',
          `What is ${i + 1} + ${i + 1}?`
        )
      )
    );
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    assert(succeeded > 0, `${succeeded}/3 rapid calls succeeded (retry logic working)`);
  }

  // --- Summary ---
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('❌ Test suite crashed:', err);
  process.exit(1);
});
