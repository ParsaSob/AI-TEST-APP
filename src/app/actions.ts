"use server";

import { suggestMessageEdits, type SuggestMessageEditsOutput } from "@/ai/flows/suggest-message-edits";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface AIResponse {
  editedMessage: string;
  explanation: string;
}

export async function handleSendMessage(
  userId: string,
  originalMessage: string
): Promise<AIResponse | { error: string }> {
  if (!userId) {
    return { error: "User not authenticated." };
  }
  if (!originalMessage.trim()) {
    return { error: "Message cannot be empty." };
  }

  try {
    const aiResult: SuggestMessageEditsOutput = await suggestMessageEdits({ message: originalMessage });

    if (!aiResult || !aiResult.editedMessage) {
      return { error: "AI failed to generate a response." };
    }
    
    await addDoc(collection(db, "messages"), {
      userId,
      originalMessage,
      aiEditedMessage: aiResult.editedMessage,
      aiExplanation: aiResult.explanation,
      timestamp: serverTimestamp(),
    });

    return {
      editedMessage: aiResult.editedMessage,
      explanation: aiResult.explanation,
    };
  } catch (error) {
    console.error("Error handling message:", error);
    // Check if error is an instance of Error and has a message property
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while processing your message.";
    return { error: `Failed to process message: ${errorMessage}` };
  }
}
