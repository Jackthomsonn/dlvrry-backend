import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { FirebaseAuthStrategy } from "../../classes/firebaseAuthStrategy";
import { Payment } from "../../classes/payment/index";
import { Response } from "../../classes/response/index";

export const removePaymentMethod = functions.https.onRequest(
  async (request, response) => {
    const auth = new FirebaseAuthStrategy();

    if (!admin.apps.length) {
      admin.initializeApp();
    }

    try {
      await auth.verify(request);

      const result = await Payment.removePaymentMethod(
        request.body.payment_method_id
      );

      response.send(Response.success(result));
    } catch (e) {
      response.status(e.status ? e.status : 500).send(Response.fail(e));
    }
  }
);
