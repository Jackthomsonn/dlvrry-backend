import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as request from 'request';

import { Response } from './../../classes/response/index';

const initiateAuth = (client_id: string, client_secret: string) => {
  return new Promise((resolve, reject) => {
    const body = {
      client_id: client_id,
      client_secret: client_secret,
      audience: 'https://dlvrry-functions.ngrok.io/dlvrry-33018/us-central1',
      grant_type: 'client_credentials',
    };

    const options = {
      method: 'POST',
      url: 'https://dlvrry.eu.auth0.com/oauth/token',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    };

    request(options, function (error: any, response: any, result: any) {
      if (error) {
        reject(error);
      }

      resolve(result);
    });
  });
}

export const connectClient = functions.https.onRequest(async (req, response) => {
  if (!admin.apps.length) {
    admin.initializeApp();
  };

  try {
    const result = await initiateAuth(req.body.client_id, req.body.client_secret);

    response.send(Response.success(result));
  }
  catch (e) {
    response.status(e.status ? e.status : 500).send(Response.fail(e));
  }
})
