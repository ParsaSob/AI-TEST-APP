
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios'; // Using import for axios
import type { AxiosError } from 'axios'; // Import AxiosError type

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
} catch (e) {
  functions.logger.error('Firebase admin initialization error', e);
}

const db = admin.firestore();

/**
 * Updates the Firestore document with an error message.
 * @param {admin.firestore.DocumentReference} docRef Reference to the Firestore document.
 * @param {string} docId The ID of the document (for logging).
 * @param {string} errorMessage The error message to save.
 */
async function updateFirestoreWithError(
  docRef: admin.firestore.DocumentReference,
  docId: string,
  errorMessage: string
): Promise<void> {
  try {
    await docRef.update({
      error_message: errorMessage,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      status: 'error',
    });
    functions.logger.info(
      `[docId: ${docId}] Successfully updated Firestore with error message: "${errorMessage}"`
    );
  } catch (updateError) {
    functions.logger.error(
      `[docId: ${docId}] CRITICAL: Failed to update Firestore with error message. Update error:`,
      updateError
    );
  }
}

/**
 * Calls the Gemini API to get an AI response for the given message.
 * @param {string} message The message text to send to the AI.
 * @param {string} docIdForLogging The document ID for logging purposes.
 * @return {Promise<string>} The AI-generated response text.
 */
async function getAIResponse(
  message: string,
  docIdForLogging: string
): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY || functions.config().gemini?.apikey;

  if (!apiKey) {
    functions.logger.error(
      `[docId: ${docIdForLogging}] Gemini API key is not configured. GEMINI_API_KEY env var or functions.config().gemini.apikey must be set.`
    );
    throw new Error('Gemini API key is not configured.');
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  const requestBody = {
    contents: [{ parts: [{ text: message }] }],
  };
  const headers = {
    'Content-Type': 'application/json',
  };
  const timeoutMs = 30000; // 30 seconds timeout

  functions.logger.info(
    `[docId: ${docIdForLogging}] Calling AI API at ${url} for message: "${message}"`
  );

  try {
    const response = await axios.post(`${url}?key=${apiKey}`, requestBody, {
      headers,
      timeout: timeoutMs,
    });

    functions.logger.debug(
      `[docId: ${docIdForLogging}] Raw AI API response data:`,
      JSON.stringify(response.data)
    );

    if (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text
    ) {
      let aiText = response.data.candidates[0].content.parts[0].text;
      const maxResponseLength = 10000; // Safeguard against extremely long responses
      if (aiText.length > maxResponseLength) {
        aiText = aiText.substring(0, maxResponseLength) + '... (truncated)';
        functions.logger.warn(
          `[docId: ${docIdForLogging}] AI response truncated to ${maxResponseLength} characters.`
        );
      }
      functions.logger.info(
        `[docId: ${docIdForLogging}] Extracted AI text: "${aiText}"`
      );
      return aiText;
    } else if (response.data?.promptFeedback?.blockReason) {
      const blockReason = response.data.promptFeedback.blockReason;
      functions.logger.error(
        `[docId: ${docIdForLogging}] AI response blocked due to: ${blockReason}. Full feedback:`,
        JSON.stringify(response.data.promptFeedback)
      );
      throw new Error(`AI response blocked due to: ${blockReason}`);
    } else {
      functions.logger.error(
        `[docId: ${docIdForLogging}] Invalid AI response structure. Full response:`,
        JSON.stringify(response.data)
      );
      throw new Error('AI response did not contain valid content.');
    }
  } catch (error) {
    let errorMessage = 'Failed to get AI response.';
    const axiosError = error as AxiosError; // Type assertion
    if (axiosError.isAxiosError) {
      errorMessage = `AI API request failed: ${axiosError.message}.`;
      if (axiosError.response) {
        errorMessage += ` Status: ${
          axiosError.response.status
        }. Response Data: ${JSON.stringify(axiosError.response.data)}.`;
      } else if (axiosError.request) {
        errorMessage += ' No response received from AI API (network error or timeout).';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    functions.logger.error(
      `[docId: ${docIdForLogging}] Error during AI API call: ${errorMessage}`,
      error // Log the original error object for more details
    );
    throw new Error(errorMessage); // Re-throw with a more descriptive message
  }
}

export const processMessage = functions.firestore
  .document('user_messages/{docId}')
  .onCreate(async (snap, context) => {
    const docId = context.params.docId;
    const docRef = snap.ref;

    functions.logger.info(`[docId: ${docId}] Processing new message.`);

    const data = snap.data();
    if (!data) {
      functions.logger.error(
        `[docId: ${docId}] Document data is undefined. This should not happen for an onCreate trigger.`
      );
      // Cannot update Firestore if snap.data() is undefined, so just log and return.
      return;
    }

    const messageText = data.message_text?.trim();

    if (!messageText) {
      functions.logger.error(
        `[docId: ${docId}] 'message_text' is missing or empty in document data.`,
        { data }
      );
      await updateFirestoreWithError(
        docRef,
        docId,
        "Message text was missing in the document."
      );
      return;
    }

    functions.logger.info(
      `[docId: ${docId}] Extracted message text: "${messageText}"`
    );

    try {
      await docRef.update({
        status: 'processing_ai',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      functions.logger.info(`[docId: ${docId}] Set status to 'processing_ai'.`);

      const aiResponse = await getAIResponse(messageText, docId);
      functions.logger.info(
        `[docId: ${docId}] Received AI response: "${aiResponse}"`
      );

      await docRef.update({
        response_text: aiResponse,
        status: 'completed',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        error_message: admin.firestore.FieldValue.delete(), // Remove any previous error
      });
      functions.logger.info(
        `[docId: ${docId}] Successfully updated Firestore with AI response.`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      functions.logger.error(
        `[docId: ${docId}] Error processing message or getting AI response: ${errorMessage}`,
        error // Log the original error
      );
      await updateFirestoreWithError(
        docRef,
        docId,
        `Failed to process message: ${errorMessage}`
      );
    }
  });

    