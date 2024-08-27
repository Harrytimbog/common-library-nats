import {
  JetStreamClient,
  JetStreamManager,
  NatsConnection,
  connect,
} from "nats";
import { Subjects } from "./subjects";

export class NatsWrapper {
  private _client?: NatsConnection;
  private _jsClient?: JetStreamClient;

  get client() {
    if (!this._client) {
      throw new Error("Cannot access NATS client before connecting.");
    }
    return this._client;
  }

  get jsClient() {
    if (!this._jsClient) {
      throw new Error("Cannot access JetStream client before connecting.");
    }
    return this._jsClient;
  }

  async connect(url: string): Promise<void> {
    this._client = await connect({ servers: [url] });
    this._jsClient = this.client.jetstream();

    // Ensure JetStream is available
    if (!this._jsClient) {
      throw new Error("Failed to initialize JetStream Client.");
    }

    console.log("Successfully connected to NATS and initialized JetStream.");
  }

  async createStreamIfNotExists(
    streamName: string,
    subjects: string[]
  ): Promise<void> {
    const jsm: JetStreamManager = await this.client.jetstreamManager();
    const streams = await jsm.streams.list().next();
    const streamExists = streams.some(
      (stream) => stream.config.name === streamName
    );

    if (!streamExists) {
      await jsm.streams.add({
        name: streamName,
        subjects: subjects,
      });
      console.log(`Stream ${streamName} created.`);
    } else {
      console.log(`Stream ${streamName} already exists.`);
    }
  }

  async close() {
    if (this._client) {
      await this._client.close();
      console.log("NATS connection closed.");
    }
  }
}

export const natsWrapper = new NatsWrapper();
