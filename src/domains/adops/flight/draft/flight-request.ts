import * as text from "../../../../kit/text.js";

/** Where a flight request is in its life cycle. */
export type FlightRequestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A flight request. Its code is unique within a tenant. */
export class FlightRequest {
  code: string;
  name: string;
  phone: string;
  clicks: number;
  visible: boolean;
  sequence: number;
  weight: number;
  channel: string;
  cost: number;
  minimum: number;
  status: FlightRequestStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    clicks: number,
    visible: boolean,
    sequence: number,
    weight: number,
    channel: string,
    cost: number,
    minimum: number,
    status: FlightRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.clicks = clicks;
    this.visible = visible;
    this.sequence = sequence;
    this.weight = weight;
    this.channel = channel;
    this.cost = cost;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightRequestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.cost - this.sequence) * 100) / 100;
  }

  copy(): FlightRequest {
    return new FlightRequest(
      this.code,
      this.name,
      this.phone,
      this.clicks,
      this.visible,
      this.sequence,
      this.weight,
      this.channel,
      this.cost,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a flight request in status planned. */
export function newFlightRequest(code: string, name: string): FlightRequest {
  return new FlightRequest(code, name, "", 0, false, 0, 0, "", 0, 0, "planned");
}
