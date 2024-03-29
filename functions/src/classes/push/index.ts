import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { User } from "../user";

export class Push {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  async sendNotification(recipient: string, message: string, title: string) {
    try {
      await this.expo.sendPushNotificationsAsync([
        {
          to: recipient,
          sound: "default",
          body: message,
          title: title,
          data: {},
        },
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  async broadcastNotification(message: string, title: string) {
    const messages: ExpoPushMessage[] = [];

    const user = new User();

    const users = await user.list();

    const tokens = users.docs.map((userDoc) => userDoc.data().push_token);

    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        continue;
      }

      messages.push({
        to: token,
        sound: "default",
        body: message,
        title: title,
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
