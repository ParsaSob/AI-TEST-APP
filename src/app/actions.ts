
"use server";

import { generateAiResponse, type GenerateAiResponseInput, type GenerateAiResponseOutput } from "@/ai/flows/generate-ai-response-flow";

interface HandleSendMessageResult {
  success: boolean;
  aiResponse?: string;
  error?: string;
}

export async function handleSendMessage(
  userId: string, // userId is kept for signature consistency, though not used by the current Genkit flow
  originalMessage: string
): Promise<HandleSendMessageResult> {
  console.log("[Action] handleSendMessage (Genkit) called with userId:", userId, "Message:", originalMessage);

  if (!originalMessage || !originalMessage.trim()) {
    console.warn("[Action] originalMessage is empty in handleSendMessage.");
    return { success: false, error: "Message cannot be empty." };
  }

  const trimmedMessage = originalMessage.trim();
  console.log("[Action] Calling Genkit flow 'generateAiResponse' with message:", trimmedMessage);

  try {
    const input: GenerateAiResponseInput = { message: trimmedMessage };
    const genkitResult: GenerateAiResponseOutput = await generateAiResponse(input);

    if (genkitResult && genkitResult.response) {
      console.log("[Action] Genkit flow successful. AI Response:", genkitResult.response);
      return {
        success: true,
        aiResponse: genkitResult.response,
      };
    } else {
      console.error("[Action] Genkit flow returned an unexpected result or no response:", genkitResult);
      return { success: false, error: "AI did not provide a valid response." };
    }
  } catch (error: any) {
    console.error("[Action] Error calling Genkit flow in handleSendMessage:", error);
    let errorMessage = "An error occurred while getting the AI response.";
    if (error.message) {
      errorMessage += ` (Details: ${error.message})`;
    }
    return { success: false, error: errorMessage };
  }
}
