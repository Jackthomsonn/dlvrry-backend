import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { User } from "../user";

export class Push {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  sendNotification(token: string, message: string, title: string) {
    const messages: ExpoPushMessage[] = [];

    if (!Expo.isExpoPushToken(token)) {
      throw new Error("Not a valid push token");
    }

    messages.push({
      to: token,
      sound: "default",
      body: message,
      title: title,
      data: {},
    });

    const chunks = this.expo.chunkPushNotifications(messages);

    async () => {
      for (const chunk of chunks) {
        try {
          await this.expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error(error);
        }
      }
    };
  }

  async broadcastNotification(message: string, title: string) {
    const messages: ExpoPushMessage[] = [];

    const user = new User();

    const users = await user.list();

    const tokens = users.docs.map((u) => u.data().push_token);

    console.log(tokens);

    const tickets: ExpoPushTicket[] = [];

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

    console.log(messages);

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }

    const receiptIds = [];
    for (const ticket of tickets as any) {
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }

    const receiptIdChunks =
      this.expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(
          chunk
        );
        console.log(receipts);

        for (const receiptId in receipts) {
          // eslint-disable-next-line no-shadow
          const { status, message, details } = <any>receipts[receiptId];
          if (status === "ok") {
            continue;
          } else if (status === "error") {
            console.error(
              `There was an error sending a notification: ${message}`
            );
            if (details && details.error) {
              console.error(`The error code is ${details.error}`);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}
