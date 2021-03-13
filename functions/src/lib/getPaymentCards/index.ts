import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FirebaseAuthStrategy } from './../../classes/firebaseAuthStrategy/index';
import { Payment } from '../../classes/payment';
import { Response } from './../../classes/response/index';

export const getPaymentCards = functions.https.onRequest(async (request, response) => {
  const auth = new FirebaseAuthStrategy();

  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    await auth.verify(request);

    const result = await Payment.getPaymentMethods(request);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})
