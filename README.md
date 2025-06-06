# Firebase + AI Mini App

A small web app built with Firebase for the Junior Developer Assessment. Users can sign in with Google, submit a text message, and receive an AI-generated response using the Google Gemini API.

## Setup
1. Clone the repository: `git clone https://github.com/ParsaSob/AI-TEST-APP.git`
2. Install dependencies: `cd functions && npm install`
3. Set Gemini API key: `firebase functions:config:set gemini.apikey="your-api-key"`
4. Deploy: `firebase deploy --only functions,hosting`

## Features
- Google Sign-In with Firebase Authentication
- Firestore for storing user messages and AI responses
- Firebase Functions for backend logic and Gemini API integration
- Firebase Hosting for frontend deployment
