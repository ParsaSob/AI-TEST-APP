// 'use server';

/**
 * @fileOverview AI flow that suggests edits to improve the clarity and tone of a message.
 *
 * - suggestMessageEdits - A function that suggests edits to a user message.
 * - SuggestMessageEditsInput - The input type for the suggestMessageEdits function.
 * - SuggestMessageEditsOutput - The return type for the suggestMessageEdits function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMessageEditsInputSchema = z.object({
  message: z.string().describe('The message to improve.'),
});
export type SuggestMessageEditsInput = z.infer<typeof SuggestMessageEditsInputSchema>;

const SuggestMessageEditsOutputSchema = z.object({
  editedMessage: z
    .string()
    .describe('The message with suggested edits for improved clarity and tone.'),
  explanation: z.string().describe('Explanation of why each edit was suggested.'),
});
export type SuggestMessageEditsOutput = z.infer<typeof SuggestMessageEditsOutputSchema>;

export async function suggestMessageEdits(input: SuggestMessageEditsInput): Promise<SuggestMessageEditsOutput> {
  return suggestMessageEditsFlow(input);
}

const suggestMessageEditsPrompt = ai.definePrompt({
  name: 'suggestMessageEditsPrompt',
  input: {schema: SuggestMessageEditsInputSchema},
  output: {schema: SuggestMessageEditsOutputSchema},
  prompt: `You are an AI assistant that helps users improve the clarity and tone of their messages.

  Suggest edits to the following message to improve its clarity and tone. Explain why each edit was suggested.

  Message: {{{message}}}
  `,
});

const suggestMessageEditsFlow = ai.defineFlow(
  {
    name: 'suggestMessageEditsFlow',
    inputSchema: SuggestMessageEditsInputSchema,
    outputSchema: SuggestMessageEditsOutputSchema,
  },
  async input => {
    const {output} = await suggestMessageEditsPrompt(input);
    return output!;
  }
);
