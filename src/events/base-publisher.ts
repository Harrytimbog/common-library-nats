import { JetStreamClient, StringCodec, PubAck } from "nats";
import { Subjects } from "./subjects";

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Publisher<T extends Event> {
  abstract subject: T["subject"];
  private client: JetStreamClient;
  private sc = StringCodec();

  constructor(client: JetStreamClient) {
    this.client = client;
  }

  async publish(data: T["data"]): Promise<void> {
    const encodedData = this.sc.encode(JSON.stringify(data));

    try {
      // The JetStream publish method returns a PubAck object
      const pubAck: PubAck = await this.client.publish(
        this.subject,
        encodedData
      );
      console.log(
        `Event published to subject: ${this.subject} with sequence: ${pubAck.seq}`
      );
    } catch (err) {
      console.error("Error publishing event:", err);
    }
  }
}
