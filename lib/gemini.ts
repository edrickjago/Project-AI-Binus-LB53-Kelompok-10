import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// ─── Key Pool ────────────────────────────────────────────────────────────────
// All 7 keys are tried in round-robin order. On quota / rate-limit errors the
// rotator advances to the next key automatically so no request is dropped.
const GEMINI_API_KEYS: string[] = (process.env.GEMINI_API_KEYS || '')
  .split(',')
  .map(key => key.trim())
  .filter(Boolean);

// ─── Model Priority ───────────────────────────────────────────────────────────
// Confirmed available via API. Newest / most capable first.
// gemini-1.5-flash and gemini-1.5-pro are discontinued — removed.
export const MODEL_PRIORITY: string[] = [
  'gemini-3.5-flash',        // Newest & fastest
  'gemini-3.1-flash-lite',   // Lightweight, low quota usage
  'gemini-2.5-flash',        // Stable fallback
  'gemini-2.0-flash',        // Wider availability fallback
  'gemini-2.0-flash-lite',   // Lowest-cost last resort
];

// ─── Round-Robin State ────────────────────────────────────────────────────────
// Module-level variable persists across requests in the same server process.
let poolIndex = 0;

function nextPoolKey(): string {
  const key = GEMINI_API_KEYS[poolIndex];
  poolIndex = (poolIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

// ─── Error Classification ─────────────────────────────────────────────────────
function isQuotaError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  const msg = e?.message ?? String(err);
  return (
    e?.status === 429 ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('Quota') ||
    msg.includes('Too Many Requests') ||
    msg.includes('RESOURCE_EXHAUSTED')
  );
}

function isKeyInvalidError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  const msg = e?.message ?? String(err);
  return (
    e?.status === 401 ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('API key not valid')
  );
}

function isModelUnavailableError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  const msg = e?.message ?? String(err);
  return (
    e?.status === 404 ||
    e?.status === 503 ||
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('not supported') ||
    msg.includes('overloaded') ||
    msg.includes('503') ||
    msg.includes('Service Unavailable')
  );
}

// ─── Core Executor ────────────────────────────────────────────────────────────
/**
 * Calls `fn(genAI, modelName)` trying every model in MODEL_PRIORITY, and on
 * quota / invalid-key errors rotates to the next key in the pool.
 *
 * @param fn         Your Gemini call. Receives a fresh GoogleGenerativeAI
 *                   instance and a model name string.
 * @param userApiKey Optional key supplied by the client (tried first).
 */
export async function callGemini<T>(
  fn: (genAI: GoogleGenerativeAI, model: string) => Promise<T>,
  userApiKey?: string,
): Promise<T> {
  // Build ordered key list: user key first, then pool starting at current index
  const keys: string[] = userApiKey
    ? [
        userApiKey,
        ...GEMINI_API_KEYS.filter((k) => k !== userApiKey),
      ]
    : [
        ...GEMINI_API_KEYS.slice(poolIndex),
        ...GEMINI_API_KEYS.slice(0, poolIndex),
      ];

  let lastError: unknown;

  for (const apiKey of keys) {
    // Advance pool index so the next request starts on the next key
    if (!userApiKey) poolIndex = (poolIndex + 1) % GEMINI_API_KEYS.length;

    let modelError: unknown;

    for (const modelName of MODEL_PRIORITY) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const result = await fn(genAI, modelName);
        console.log(`[Gemini] OK  key=…${apiKey.slice(-6)}  model=${modelName}`);
        return result;
      } catch (err) {
        if (isModelUnavailableError(err)) {
          // This model isn't available — try the next one
          console.warn(`[Gemini] Model unavailable: ${modelName}`);
          modelError = err;
          continue;
        }
        if (isQuotaError(err) || isKeyInvalidError(err)) {
          // Key is exhausted / invalid — break inner loop and try next key
          console.warn(`[Gemini] Key quota/invalid: …${apiKey.slice(-6)}`);
          lastError = err;
          modelError = undefined;
          break;
        }
        // Any other error (bad request, JSON parse, etc.) — propagate immediately
        throw err;
      }
    }

    if (modelError) {
      // All models failed for this key (unlikely but guard it)
      lastError = modelError;
    }
  }

  throw lastError ?? new Error('All Gemini API keys and models exhausted.');
}

// ─── Retry helper for transient 503 overload ──────────────────────────────────
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (isModelUnavailableError(err) && i < retries - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 800));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Retry limit reached');
}
