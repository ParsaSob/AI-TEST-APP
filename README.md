# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

I developed the AI Response App as a Next.js project using React for the user interface, with Tailwind CSS and ShadCN UI for styling and UI components. Users authenticate through Google Sign-In via Firebase Authentication to securely access the app. When a user submits a message, the input is handled by a Next.js Server Action (handleSendMessage), which triggers a Genkit flow (generateAiResponseFlow) that integrates with the Google Gemini API to generate a relevant AI response.

The original message, AI-generated reply, user ID, and timestamp are stored in the user_messages collection in Firestore. I used Firebase Functions to manage AI API calls and database operations securely on the backend. The app is deployed with Firebase Hosting, and I iteratively refined the layout, colors, and UI structure based on feedback. This project showcases my ability to integrate Firebase services, external AI tools, and modern frontend technologies into a complete, functional web application.
