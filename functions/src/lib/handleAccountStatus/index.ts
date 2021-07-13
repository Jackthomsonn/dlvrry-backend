import { StripeAuthStrategy } from "./../../classes/stripeAuthStrategy/index";
import { Response } from "./../../classes/response/index";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import { Stripe } from "stripe";
import { User } from "./../../classes/user/index";
import { VerificationStatus } from "dlvrry-common";

export const handleAccountStatus = functions.https.onRequest(
  async (request, response) => {
    const user = new User();
    const auth = new StripeAuthStrategy();

    if (!admin.apps.length) {
      admin.initializeApp();
    }

    try {
      auth.verify(
        request,
        functions.config().dlvrry[
          process.env.FUNCTIONS_EMULATOR === "true" ? "test" : "prod"
        ].account_status_secret
      );

      const onboardingEvent: Stripe.Event = request.body;
      const object = <Stripe.Account>onboardingEvent.data.object;
      const possible_disabled_reasons = [
        {
          code: "requirements.past_due",
          status: VerificationStatus.PAST_DUE,
        },
        {
          code: "requirements.pending_verification",
          status: VerificationStatus.PENDING_VERIFICATION,
        },
        {
          code: "rejected.fraud",
          status: VerificationStatus.REJECTED_FRAUDULENT,
        },
        {
          code: "rejected.terms_of_service",
          status: VerificationStatus.REJECTED_TERMS_OF_SERVICE,
        },
        {
          code: "rejected.listed",
          status: VerificationStatus.REJECTED_LISTED,
        },
        {
          code: "rejected.other",
          status: VerificationStatus.REJECTED_OTHER,
        },
        {
          code: "listed",
          status: VerificationStatus.LISTED,
        },
        {
          code: "under_review",
          status: VerificationStatus.UNDER_REVIEW,
        },
        {
          code: "other",
          status: VerificationStatus.OTHER,
        },
      ];

      const disabled_reason = object.requirements?.disabled_reason;
      const verification_status = possible_disabled_reasons.find(
        (reason) => reason.code === disabled_reason
      ) || { status: VerificationStatus.OTHER };

      if (disabled_reason !== null) {
        await user.updateWhere(
          {
            field: "connected_account_id",
            operation: "==",
            value: onboardingEvent.account,
          },
          { verification_status: verification_status.status }
        );
      } else {
        await user.updateWhere(
          {
            field: "connected_account_id",
            operation: "==",
            value: onboardingEvent.account,
          },
          { verification_status: VerificationStatus.COMPLETE }
        );
      }

      response.send(Response.success());
    } catch (e) {
      response.status(e.status ? e.status : 500).send(Response.fail(e));
    }
  }
);
