import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { FirebaseAuthStrategy } from "../../classes/firebaseAuthStrategy";

import { Payment } from "./../../classes/payment/index";
import { Response } from "./../../classes/response/index";

export const addPaymentMethod = functions.https.onRequest(
  async (request, response) => {
    const auth = new FirebaseAuthStrategy();

    if (!admin.apps.length) {
      admin.initializeApp();
    }

    response.set("Access-Control-Allow-Origin", "*");

    if (request.method === "OPTIONS") {
      response.set("Access-Control-Allow-Methods", "POST");
      response.set("Access-Control-Max-Age", "3600");
      response.status(204).send("");
    }

    try {
      const token = request.url.split("?")[2];

      await auth.verify(<any>{
        headers: {
          authorization: token,
        },
      });

      const result = await Payment.addPaymentMethod(request);

      response.send(Response.success(result));
    } catch (e) {
      response.status(e.status ? e.status : 500).send(Response.fail(e));
    }
  }
);
