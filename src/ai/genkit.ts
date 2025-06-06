
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Genkit will automatically look for GEMINI_API_KEY or GOOGLE_API_KEY
// in the environment variables on the server (e.g., in Vercel).
// Ensure this is set in your Vercel project settings.

// Attempt to read the API key from the environment.
const apiKeyFromEnv = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKeyFromEnv && typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
  // This log might appear during the build or runtime in Vercel function logs.
  console.warn(
    'AI_GENKIT_TS: GEMINI_API_KEY or GOOGLE_API_KEY is not set in the production environment. Genkit calls will likely fail.'
  );
}

export const ai = genkit({
  plugins: [
    // Explicitly pass the API key if found.
    // The googleAI plugin also attempts to find it automatically.
    googleAI(apiKeyFromEnv ? {apiKey: apiKeyFromEnv} : undefined)
  ],
  model: 'googleai/gemini-1.5-flash-latest',
});
