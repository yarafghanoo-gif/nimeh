# Nimeh — Dating App

Mobile-first Tinder-style dating web app built with HTML, CSS, JavaScript, and Firebase.

## Features

- **Auth:** Email/password and Google sign-in (Firebase Auth)
- **Discover:** User cards with photo, name, age; swipe right (like) / left (skip); Like and Super Like buttons
- **Matches:** When two users like each other, a match is created; list view with tap to open chat
- **Chat:** Real-time messaging via Firestore
- **Profile:** Photo, name, age, bio, interests; edit profile and photo upload (Firebase Storage)

## Setup

1. **Create a Firebase project** at [Firebase Console](https://console.firebase.google.com).

2. **Enable sign-in methods:** Authentication → Sign-in method → enable Email/Password and Google.

3. **Get your config:** Project settings → Your apps → Add web app → copy the `firebaseConfig` object.

4. **Configure the app:** Edit `js/firebase-config.js` and replace the placeholder values with your project's config:

   ```js
   const firebaseConfig = {
     apiKey: 'YOUR_API_KEY',
     authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
     projectId: 'YOUR_PROJECT_ID',
     storageBucket: 'YOUR_PROJECT_ID.appspot.com',
     messagingSenderId: 'YOUR_SENDER_ID',
     appId: 'YOUR_APP_ID',
   };
   ```

5. **Deploy Firestore rules:** In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules` (or deploy via Firebase CLI).

6. **Create a Firestore index for chat:** When you first open a chat, Firestore will show a link in the console to create a composite index on the `messages` collection with fields `chatId` (Ascending) and `createdAt` (Ascending). Click the link to create it.

7. **Run the app:** Serve the folder over HTTP (e.g. `npx serve .` or any static server). Open the app in a browser. For Google sign-in, add your domain to Authorized domains in Firebase Auth settings.

## Project structure

```
nimeh/
├── index.html          # Single-page app shell
├── css/
│   └── styles.css      # Mobile-first styles
├── js/
│   ├── app.js          # Entry, auth state, navigation, toast
│   ├── firebase-config.js
│   ├── auth.js         # Email + Google auth
│   ├── firestore.js    # Users, likes, matches, messages
│   ├── discover.js     # Card stack, swipe, like/skip
│   ├── matches.js      # Matches list
│   ├── chat.js         # Chat list + room
│   └── profile.js      # Profile view + edit + photo
├── firestore.rules
└── README.md
```

## Firestore collections

- **users** — Profile (uid, displayName, photoURL, age, bio, interests, lastSeen)
- **likes** — Document id `{fromId}_{toId}`; fields fromId, toId, isSuperLike, createdAt
- **matches** — Document id `{uid1}_{uid2}` (sorted); field users: [uid1, uid2], createdAt
- **messages** — chatId, senderId, text, createdAt

## Optional: Storage rules

In Firebase Storage → Rules, allow authenticated users to upload under `photos/{userId}/`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
