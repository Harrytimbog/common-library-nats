import {
  consumerOpts,
  JetStreamSubscription,
  JsMsg,
  NatsConnection,
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
  abstract onMessage(data: T['data'], msg: JsMsg): void;
  private client: NatsConnection;
  private subscription?: JetStreamSubscription;

  constructor(client: NatsConnection) {
    this.client = client;
  }

  subscriptionOptions() {
    const opts = consumerOpts();
    opts.ackExplicit();
    opts.deliverNew(); // Deliver only new messages
    opts.manualAck(); // Ensure manual acknowledgment is set
    opts.durable(this.queueGroupName); // Set the durable name
    opts.queue(this.queueGroupName); // Set the queue group name
    opts.deliverTo(this.queueGroupName + "_subject"); // Set the deliver subject
    return opts;
  }

  async listen() {
    const js = this.client.jetstream();
    this.subscription = await js.subscribe(
      this.subject,
      this.subscriptionOptions()
    );

    const sc = StringCodec();

    for await (const msg of this.subscription) {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);
      const parsedData = this.parseMessage(msg);
      this.onMessage(parsedData, msg);
    }
  }

  parseMessage(msg: JsMsg) {
    const data = msg.data;
    return JSON.parse(new TextDecoder().decode(data));
  }
}
