import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export const testStripe = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const docs = await admin.firestore().collection('jobs').get();

  docs.docs.forEach(async (doc) => {
    await admin.firestore().collection('jobs').doc(doc.id).delete();
  });
});