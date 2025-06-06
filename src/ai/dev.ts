import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-message.ts';
import '@/ai/flows/suggest-message-edits.ts';
import '@/ai/flows/generate-ai-response-flow.ts';
