'use server';

/**
 * @fileOverview Summarizes a given message using an AI model.
 *
 * - summarizeMessage - A function that summarizes the message.
 * - SummarizeMessageInput - The input type for the summarizeMessage function.
 * - SummarizeMessageOutput - The return type for the summarizeMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMessageInputSchema = z.object({
  message: z.string().describe('The message to be summarized.'),
});
export type SummarizeMessageInput = z.infer<typeof SummarizeMessageInputSchema>;

const SummarizeMessageOutputSchema = z.object({
  summary: z.string().describe('The summarized message.'),
});
export type SummarizeMessageOutput = z.infer<typeof SummarizeMessageOutputSchema>;

export async function summarizeMessage(input: SummarizeMessageInput): Promise<SummarizeMessageOutput> {
  return summarizeMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMessagePrompt',
  input: {schema: SummarizeMessageInputSchema},
  output: {schema: SummarizeMessageOutputSchema},
  prompt: `Summarize the following message in a concise manner:\n\n{{message}}`,
});

const summarizeMessageFlow = ai.defineFlow(
  {
    name: 'summarizeMessageFlow',
    inputSchema: SummarizeMessageInputSchema,
    outputSchema: SummarizeMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
