
"use server";

import { generateAiResponse, type GenerateAiResponseInput, type GenerateAiResponseOutput } from "@/ai/flows/generate-ai-response-flow";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";

interface HandleSendMessageResult {
  success: boolean;
  aiResponse?: string;
  error?: string;
}

export async function handleSendMessage(
  userId: string,
  originalMessage: string
): Promise<HandleSendMessageResult> {
  // Diagnostic log for GEMINI_API_KEY
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.GEMINI_API_KEY) {
      console.log("[Action] GEMINI_API_KEY is SET. Length:", process.env.GEMINI_API_KEY.length);
    } else if (process.env.GOOGLE_API_KEY) {
      console.log("[Action] GOOGLE_API_KEY is SET. Length:", process.env.GOOGLE_API_KEY.length);
    }
    else {
      console.error("[Action] NEITHER GEMINI_API_KEY NOR GOOGLE_API_KEY IS SET in process.env.");
    }
  } else {
    console.error("[Action] process.env is not available or process is undefined.");
  }


  console.log("[Action] handleSendMessage (Genkit direct) called with userId:", userId, "Message:", originalMessage);

  if (!originalMessage || !originalMessage.trim()) {
    console.warn("[Action] originalMessage is empty in handleSendMessage.");
    return { success: false, error: "Message cannot be empty." };
  }

  const trimmedMessage = originalMessage.trim();
  let docRef; // To store the reference of the newly created document

  try {
    // 1. Save the user's message to Firestore
    console.log("[Action] Attempting to save user message to Firestore for userId:", userId);
    docRef = await addDoc(collection(db, "user_messages"), {
      user_id: userId,
      message_text: trimmedMessage,
      timestamp: serverTimestamp(),
      // response_text will be added later
    });
    console.log("[Action] User message saved to Firestore with docId:", docRef.id);

    // 2. Call Genkit flow to get AI response
    console.log("[Action] Calling Genkit flow 'generateAiResponse' with message:", trimmedMessage);
    const input: GenerateAiResponseInput = { message: trimmedMessage };
    const genkitResult: GenerateAiResponseOutput = await generateAiResponse(input);

    if (genkitResult && genkitResult.response) {
      console.log("[Action] Genkit flow successful. AI Response:", genkitResult.response);
      
      // 3. Update the Firestore document with the AI response
      try {
        const messageDocRef = doc(db, "user_messages", docRef.id);
        await updateDoc(messageDocRef, {
          response_text: genkitResult.response,
        });
        console.log("[Action] Firestore document updated with AI response:", docRef.id);
      } catch (firestoreUpdateError: any) {
        console.error("[Action] Error updating Firestore document with AI response:", firestoreUpdateError);
        // Proceed to return AI response to client even if Firestore update fails,
        // but log the error. The core function is to get the AI response.
        // You might want to handle this more robustly depending on requirements.
      }

      return {
        success: true,
        aiResponse: genkitResult.response,
      };
    } else {
      console.error("[Action] Genkit flow returned an unexpected result or no response:", genkitResult);
      // Attempt to save error to Firestore if docRef exists
      if (docRef) {
        try {
            const messageDocRef = doc(db, "user_messages", docRef.id);
            await updateDoc(messageDocRef, {
                error_message: "AI did not provide a valid response.",
            });
        } catch (e) {
            // ignore
        }
      }
      return { success: false, error: "AI did not provide a valid response." };
    }
  } catch (error: any) {
    console.error("[Action] Error in handleSendMessage:", error);
    let errorMessage = "An error occurred during message processing.";
    if (error.message) {
      errorMessage += ` (Details: ${error.message})`;
    }
     // Attempt to save error to Firestore if docRef exists
    if (docRef) {
        try {
            const messageDocRef = doc(db, "user_messages", docRef.id);
            await updateDoc(messageDocRef, {
                error_message: errorMessage,
            });
        } catch (e) {
             // ignore
        }
    }
    return { success: false, error: errorMessage };
  }
}
