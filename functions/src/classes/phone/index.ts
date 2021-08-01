import { Twilio } from "twilio";
import * as functions from "firebase-functions";
import { get_env } from "../../helpers/env";

const environment = get_env();

export class Phone {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      functions.config().dlvrry[environment].twilio_username,
      functions.config().dlvrry[environment].twilio_password
    );
  }

  async send(phone_number: string, message: string) {
    await this.client.messages.create({
      body: message,
      from: "(786) 808-1083",
      to: phone_number,
    });
  }
}
