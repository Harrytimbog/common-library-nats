import {
  JetStreamClient,
  JsMsg,
  consumerOpts,
  JetStreamPullSubscription,
} from "nats";
import { Subjects } from "./subjects";

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Listener<T extends Event> {
  abstract subject: T["subject"];
  abstract queueGroupName: string;
  abstract onMessage(data: T["data"], msg: JsMsg): void;
  protected jsClient: JetStreamClient;
  protected ackWait = 5 * 1000;

  constructor(jsClient: JetStreamClient) {
    this.jsClient = jsClient;
  }

  subscriptionOptions() {
    return consumerOpts()
      .manualAck()
      .ackWait(this.ackWait)
      .durable(this.queueGroupName); // Only keep this for durable consumer
  }

  async listen() {
    try {
      const subscription: JetStreamPullSubscription =
        await this.jsClient.pullSubscribe(
          this.subject,
          this.subscriptionOptions()
        );

      await this.processMessages(subscription);
    } catch (error) {
      const err = error as Error; // Assert the error as an Error object
      if (err.message.includes("consumer already exists")) {
        console.warn(
          `Consumer for ${this.queueGroupName} already exists. Reusing existing consumer.`
        );
        // Additional logic can be added here if needed
      } else {
        console.error("Error while listening:", err);
      }
    }
  }

  async processMessages(subscription: JetStreamPullSubscription) {
    const batchSize = 10; // Number of messages to pull in each batch

    for (;;) {
      subscription.pull({ batch: batchSize });
      for await (const msg of subscription) {
        console.log(`Message received: ${this.subject}/${this.queueGroupName}`);
        const parsedData = this.parseMessage(msg);
        this.onMessage(parsedData, msg);
        msg.ack(); // Acknowledge after processing
      }
    }
  }

  parseMessage(msg: JsMsg) {
    return JSON.parse(msg.data.toString());
  }
}
