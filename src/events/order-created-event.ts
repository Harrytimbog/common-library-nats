import { Subjects } from "./subjects";
import { OrderStatus } from "./types/order-status";

export interface OrderCreatedEvent {
  subject: Subjects.OrderCreated;
  data: {
    id: string;
    status: OrderStatus;
    userId: string;
    expiresAt: string; // This is a string and not left as date format because we are going to serialize it
    ticket: {
      id: string;
      price: number;
    };
  };
}
