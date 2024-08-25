import {
  JetStreamClient,
  JetStreamManager,
  NatsConnection,
  connect,
} from "nats";

export class NatsWrapper {
  private _client?: NatsConnection;
  private _jsClient?: JetStreamClient;

  get client(): NatsConnection {
    if (!this._client) {
      throw new Error("Cannot access NATS client before connecting.");
    }
    return this._client;
  }

  get jsClient(): JetStreamClient {
    if (!this._jsClient) {
      throw new Error("Cannot access JetStream client before connecting.");
    }
    return this._jsClient;
  }

  async connect(url: string): Promise<void> {
    try {
      this._client = await connect({ servers: [url] });
      this._jsClient = this.client.jetstream();
      console.log("Successfully connected to NATS and initialized JetStream.");

      const subjects = ["gittix.*"];
      await this.createStreamIfNotExists("GITTIX", subjects);
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

  close(): void {
    if (this._client) {
      this._client.close();
      console.log("NATS connection closed.");
    }
  }
}

export const natsWrapper = new NatsWrapper();
