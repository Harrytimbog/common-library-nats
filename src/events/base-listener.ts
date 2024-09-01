import {
  JetStreamClient,
  JsMsg,
  consumerOpts,
  JetStreamPullSubscription,
  StringCodec,
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
    const consumerOptions = consumerOpts()
      .manualAck()
      .ackWait(this.ackWait)
      .durable(this.queueGroupName);

    return consumerOptions;
  }

  async listen() {
    const subjectToSubscribe = this.subject;
    try {
      console.log(
        `Attempting to pull messages from subject: ${subjectToSubscribe}`
      );

      const subscription: JetStreamPullSubscription =
        await this.jsClient.pullSubscribe(
          subjectToSubscribe,
          this.subscriptionOptions()
        );

      await this.processMessages(subscription);
    } catch (error) {
      console.error("Error while listening:", error);
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
    const sc = StringCodec();
    const data = sc.decode(msg.data);
    return JSON.parse(data);
  }
}
