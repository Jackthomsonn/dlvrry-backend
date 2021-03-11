import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Payment } from '../../classes/payment/index';
import { Response } from '../../classes/response/index';

export const removePaymentMethod = functions.https.onRequest(async (request, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    const result = await Payment.removePaymentMethod(request.body.payment_method_id);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})