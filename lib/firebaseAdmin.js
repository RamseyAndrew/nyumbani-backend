const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

function resolveCredential() {
  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (!creds) {
    return admin.credential.applicationDefault();
  }

  // 1. Check if the variable itself is the raw JSON content (For Render)
  if (creds.trim().startsWith('{')) {
    try {
      const parsedCreds = JSON.parse(creds);
      return admin.credential.cert(parsedCreds);
    } catch (error) {
      console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS as JSON object string:', error);
    }
  }

  // 2. Fallback: Treat it as a file path (For Localhost)
  const absolute = path.isAbsolute(creds) ? creds : path.resolve(process.cwd(), creds);
  if (fs.existsSync(absolute)) {
    return admin.credential.cert(require(absolute));
  }

  console.warn(`GOOGLE_APPLICATION_CREDENTIALS file path not found: ${absolute}`);
  return admin.credential.applicationDefault();
}

function getFirebaseAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: resolveCredential(),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  return admin;
}

module.exports = { getFirebaseAdmin };
