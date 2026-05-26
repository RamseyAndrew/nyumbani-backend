const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

function resolveCredential() {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const absolute = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    if (fs.existsSync(absolute)) {
      return admin.credential.cert(require(absolute));
    }
    console.warn(`GOOGLE_APPLICATION_CREDENTIALS not found: ${absolute}`);
  }
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
