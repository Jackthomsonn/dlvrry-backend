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
    // Localise UK only
    const split_phone_number = phone_number.split("");

    split_phone_number[0] = "44";

    await this.client.messages.create({
      body: message,
      from: "(786) 808-1083",
      to: split_phone_number.join(""),
    });
  }
}
