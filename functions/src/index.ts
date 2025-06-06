import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { logger, config } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import axios from 'axios';
import type { AxiosError } from 'axios';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    logger.error('Firebase admin initialization error', e);
  }
}

const db = admin.firestore();

/**
 * Updates the Firestore document with an error message.
 * @param docRef Reference to the Firestore document.
 * @param docId The ID of the document (for logging).
 * @param errorMessage The error message to save.
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
    logger.info(`[docId: ${docId}] Successfully updated Firestore with error message: "${errorMessage}"`);
  } catch (updateError) {
    logger.error(`[docId: ${docId}] CRITICAL: Failed to update Firestore with error message. Update error:`, updateError);
  }
}

/**
 * Calls the Gemini API to get an AI response for the given message.
 * @param message The message text to send to the AI.
 * @param docIdForLogging The document ID for logging purposes.
 * @return The AI-generated response text.
 */
async function getAIResponse(message: string, docIdForLogging: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || config().gemini?.apikey;
  if (!apiKey) {
    logger.error(`[docId: ${docIdForLogging}] Gemini API key is not configured. GEMINI_API_KEY env var or functions.config().gemini.apikey must be set.`);
    throw new Error('Gemini API key is not configured.');
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  const requestBody = {
    contents: [{ parts: [{ text: message }] }],
  };
  const headers = {
    'Content-Type': 'application/json',
  };
  const timeoutMs = 30000;

  logger.info(`[docId: ${docIdForLogging}] Calling AI API at ${url} for message: "${message}"`);

  try {
    const response = await axios.post(`${url}?key=${apiKey}`, requestBody, {
      headers,
      timeout: timeoutMs,
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`[docId: ${docIdForLogging}] Raw AI API response data:`, JSON.stringify(response.data));
    }

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let aiText = response.data.candidates[0].content.parts[0].text;
      const maxResponseLength = 10000;
      if (aiText.length > maxResponseLength) {
        aiText = aiText.substring(0, maxResponseLength) + '... (truncated)';
        logger.warn(`[docId: ${docIdForLogging}] AI response truncated to ${maxResponseLength} characters.`);
      }
      logger.info(`[docId: ${docIdForLogging}] Extracted AI text: "${aiText}"`);
      return aiText;
    } else if (response.data?.promptFeedback?.blockReason) {
      const blockReason = response.data.promptFeedback.blockReason;
      logger.error(`[docId: ${docIdForLogging}] AI response blocked due to: ${blockReason}. Full feedback:`, response.data.promptFeedback);
      throw new Error(`AI response blocked due to: ${blockReason}`);
    } else {
      logger.error(`[docId: ${docIdForLogging}] Invalid AI response structure. Full response:`, response.data);
      throw new Error('AI response did not contain valid content.');
    }
  } catch (error) {
    let errorMessage = 'Failed to get AI response.';
    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError) {
      errorMessage = `AI API request failed: ${axiosError.message}.`;
      if (axiosError.response) {
        errorMessage += ` Status: ${axiosError.response.status}. Response Data: ${JSON.stringify(axiosError.response.data)}.`;
      } else if (axiosError.request) {
        errorMessage += ' No response received from AI API (network error or timeout).';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    logger.error(`[docId: ${docIdForLogging}] Error during AI API call: ${errorMessage}`, error);
    throw new Error(errorMessage);
  }
}

export const processMessage = onDocumentCreated(
  'user_messages/{docId}',
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { docId: string }>) => {
    const docId = event.params.docId;
    const snap = event.data;
    if (!snap) {
      logger.error(`[docId: ${docId}] Document data is undefined. This should not happen for an onCreate trigger.`);
      return;
    }
    const docRef = snap.ref;

    logger.info(`[docId: ${docId}] Processing new message.`);

    const data = snap.data();
    if (!data) {
      logger.error(`[docId: ${docId}] Document data is undefined. This should not happen for an onCreate trigger.`);
      await updateFirestoreWithError(docRef, docId, 'Document data was undefined.');
      return;
    }

    const messageText = data.message_text?.trim();
    if (!messageText) {
      logger.error(`[docId: ${docId}] 'message_text' is missing or empty in document data.`, { data });
      await updateFirestoreWithError(docRef, docId, 'Message text was missing in the document.');
      return;
    }

    logger.info(`[docId: ${docId}] Extracted message text: "${messageText}"`);

    try {
      await docRef.update({
        status: 'processing_ai',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`[docId: ${docId}] Set status to 'processing_ai'.`);

      const aiResponse = await getAIResponse(messageText, docId);
      logger.info(`[docId: ${docId}] Received AI response: "${aiResponse}"`);

      await docRef.update({
        response_text: aiResponse,
        status: 'completed',
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        error_message: admin.firestore.FieldValue.delete(),
      });
      logger.info(`[docId: ${docId}] Successfully updated Firestore with AI response.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      logger.error(`[docId: ${docId}] Error processing message or getting AI response: ${errorMessage}`, error);
      await updateFirestoreWithError(docRef, docId, `Failed to process message: ${errorMessage}`);
    }
  }
);