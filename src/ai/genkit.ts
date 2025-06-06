
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Genkit will automatically look for GEMINI_API_KEY or GOOGLE_API_KEY
// in the environment variables on the server (e.g., in Vercel).
// Ensure this is set in your Vercel project settings.
export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly set the default model
  // You can also configure the API key directly here if needed, but environment variables are preferred for security:
  // plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
});

