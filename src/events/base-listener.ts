import { JetStreamClient, JsMsg, consumerOpts, JetStreamManager } from "nats";
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
    let consumerOptions = consumerOpts()
      .manualAck()
      .ackWait(this.ackWait)
      .durable(this.queueGroupName)
      .deliverGroup(this.queueGroupName)
      .deliverTo(this.queueGroupName)
      .queue(this.queueGroupName)
      .deliverNew();
    return consumerOptions;
  }

  async listen() {
    const subjectToSubscribe = this.subject;
    try {
      console.log(`Attempting to subscribe to subject: ${subjectToSubscribe}`);

      // Retrieve and log current streams and their subjects
      const jsm: JetStreamManager = await this.jsClient.jetstreamManager();
      const streams = await jsm.streams.list().next();
      console.log(
        "Available Streams and Subjects:",
        streams.map((s) => ({
          streamName: s.config.name,
          subjects: s.config.subjects,
        }))
      );

      // Proceed with subscription
      const subscription = await this.jsClient.subscribe(
        subjectToSubscribe,
        this.subscriptionOptions()
      );

      for await (const msg of subscription) {
        console.log(`Message received: ${this.subject}/${this.queueGroupName}`);
        const parsedData = this.parseMessage(msg);
        this.onMessage(parsedData, msg);
      }
    } catch (error) {
      console.error("Error while listening:", error);

      // Log the subject that failed and the available streams for debugging
      try {
        const jsm: JetStreamManager = await this.jsClient.jetstreamManager();
        const streams = await jsm.streams.list().next();
        console.error(
          `Failed to subscribe to subject: ${subjectToSubscribe}. Available streams:`,
          streams.map((s) => ({
            streamName: s.config.name,
            subjects: s.config.subjects,
          }))
        );
      } catch (innerError) {
        console.error(
          "Error fetching streams during failure handling:",
          innerError
        );
      }
    }
  }

  parseMessage(msg: JsMsg) {
    const data = msg.data;
    return JSON.parse(data.toString());
  }
}
