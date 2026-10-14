import * as text from "../../../../kit/text.js";

/** Where a queue forecast is in its life cycle. */
export type QueueForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a queue forecast and its current status. */
export class QueueForecast {
  code: string;
  name: string;
  capacity: number;
  phone: string;
  retries: number;
  cohort: string;
  region: string;
  endsAt: number;
  cost: number;
  status: QueueForecastStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    phone: string,
    retries: number,
    cohort: string,
    region: string,
    endsAt: number,
    cost: number,
    status: QueueForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.phone = phone;
    this.retries = retries;
    this.cohort = cohort;
    this.region = region;
    this.endsAt = endsAt;
    this.cost = cost;
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

  canMoveTo(next: QueueForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: QueueForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round((this.capacity + this.cost) * 100) / 100;
  }

  copy(): QueueForecast {
    return new QueueForecast(
      this.code,
      this.name,
      this.capacity,
      this.phone,
      this.retries,
      this.cohort,
      this.region,
      this.endsAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a queue forecast in status planned. */
export function newQueueForecast(code: string, name: string): QueueForecast {
  return new QueueForecast(code, name, 0, "", 0, "", "", 0, 0, "planned");
}
