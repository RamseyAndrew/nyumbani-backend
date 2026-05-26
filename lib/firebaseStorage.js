const path = require('path');
const { getFirebaseAdmin } = require('./firebaseAdmin');

async function uploadPropertyImage(buffer, originalName, mimetype) {
  const admin = getFirebaseAdmin();
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) throw new Error('FIREBASE_STORAGE_BUCKET is not configured');

  const ext = path.extname(originalName) || '.jpg';
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const filename = `properties/${Date.now()}_${safeBase}${ext}`;

  const bucket = admin.storage().bucket(bucketName);
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType: mimetype },
    resumable: false,
  });

  try {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  } catch {
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000,
    });
    return signedUrl;
  }
}

module.exports = { uploadPropertyImage };
