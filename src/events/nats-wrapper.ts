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
    try {
      this._client = await connect({ servers: [url] });
      this._jsClient = this.client.jetstream();

      // Check and log existing streams
      const jsm: JetStreamManager = await this.client.jetstreamManager();
      const streams = await jsm.streams.list().next();
      console.log(
        "Existing Streams:",
        streams.map((s) => ({
          name: s.config.name,
          subjects: s.config.subjects,
        }))
      );

      const subjects = Object.values(Subjects); // No prefixing here
      await this.createStreamIfNotExists("CLONEDWOLF", subjects);

      console.log("Successfully connected to NATS and initialized JetStream.");
    } catch (err) {
      console.error("Error in NATS connection: ", err);
      throw err;
    }
  }

  async createStreamIfNotExists(
    streamName: string,
    subjects: string[]
  ): Promise<void> {
    const jsm: JetStreamManager = await this.client.jetstreamManager();
    const streams = await jsm.streams.list().next();

    console.log(
      "Current Streams:",
      streams.map((s) => ({
        name: s.config.name,
        subjects: s.config.subjects,
      }))
    );

    const streamExists = streams.some(
      (stream) => stream.config.name === streamName
    );

    if (!streamExists) {
      console.log(`Creating stream ${streamName} with subjects:`, subjects);
      await jsm.streams.add({
        name: streamName,
        subjects: subjects,
      });
      console.log(`Stream ${streamName} created.`);
    } else {
      console.log(
        `Stream ${streamName} already exists with subjects:`,
        subjects
      );
    }
  }

  close() {
    if (this._client) {
      this._client.close();
      console.log("NATS connection closed.");
    }
  }
}

export const natsWrapper = new NatsWrapper();
