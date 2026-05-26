const REQUIRED = ['DATABASE_URL', 'FIREBASE_PROJECT_ID'];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy server/.env.example to server/.env and fill in values.');
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('GOOGLE_APPLICATION_CREDENTIALS is not set; Firebase Admin will use application default credentials.');
  }
}

module.exports = { validateEnv };
