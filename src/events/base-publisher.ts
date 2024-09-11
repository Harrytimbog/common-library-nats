import { JetStreamClient } from "nats";
import { Subjects } from "./subjects";

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Publisher<T extends Event> {
  abstract subject: T["subject"];
  protected jsClient: JetStreamClient;

  constructor(jsClient: JetStreamClient) {
    this.jsClient = jsClient;
  }

  async publish(data: T["data"]): Promise<void> {
    console.log(`Publishing event to subject: ${this.subject}`);
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await this.jsClient.publish(this.subject, JSON.stringify(data));
        console.log("Event published successfully");
        break; // Exit the loop if publishing is successful
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err);
        if (attempt === 5) {
          throw new Error("Failed to publish event after 5 attempts");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }
}
