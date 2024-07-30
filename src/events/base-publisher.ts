import { NatsConnection, StringCodec } from "nats";
import { Subjects } from "./subjects";

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Publisher<T extends Event> {
  abstract subject: T["subject"];
  private client: NatsConnection;
  private sc = StringCodec();

  constructor(client: NatsConnection) {
    this.client = client;
  }

  async publish(data: T["data"]): Promise<void> {
    const encodedData = this.sc.encode(JSON.stringify(data));
    await this.client.publish(this.subject, encodedData);
    console.log("Event published to subject:", this.subject);
  }
}
