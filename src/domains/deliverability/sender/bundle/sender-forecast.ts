import * as text from "../../../../kit/text.js";

/** Where a sender forecast is in its life cycle. */
export type SenderForecastStatus = "created" | "validated" | "published" | "retired";

/** The record of a sender forecast and its current status. */
export class SenderForecast {
  code: string;
  name: string;
  threshold: number;
  amount: number;
  budget: number;
  channel: string;
  reviewer: string;
  checksum: string;
  pinned: boolean;
  graceDays: number;
  status: SenderForecastStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    amount: number,
    budget: number,
    channel: string,
    reviewer: string,
    checksum: string,
    pinned: boolean,
    graceDays: number,
    status: SenderForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.amount = amount;
    this.budget = budget;
    this.channel = channel;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.pinned = pinned;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderForecastStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round(this.amount * this.budget * 100) / 100;
  }

  copy(): SenderForecast {
    return new SenderForecast(
      this.code,
      this.name,
      this.threshold,
      this.amount,
      this.budget,
      this.channel,
      this.reviewer,
      this.checksum,
      this.pinned,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sender forecast in status created. */
export function newSenderForecast(code: string, name: string): SenderForecast {
  return new SenderForecast(code, name, 0, 0, 0, "", "", "", false, 0, "created");
}
