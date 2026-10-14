import * as text from "../../../../kit/text.js";

/** Where a batched flight budget is in its life cycle. */
export type BatchedFlightBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched flight budget as the flight team keeps it. */
export class BatchedFlightBudget {
  code: string;
  name: string;
  endsAt: number;
  approved: boolean;
  weight: number;
  locale: string;
  timezone: string;
  version: number;
  country: string;
  channel: string;
  status: BatchedFlightBudgetStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    approved: boolean,
    weight: number,
    locale: string,
    timezone: string,
    version: number,
    country: string,
    channel: string,
    status: BatchedFlightBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.approved = approved;
    this.weight = weight;
    this.locale = locale;
    this.timezone = timezone;
    this.version = version;
    this.country = country;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedFlightBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedFlightBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched flight budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round(this.version * this.endsAt * 100) / 100;
  }

  copy(): BatchedFlightBudget {
    return new BatchedFlightBudget(
      this.code,
      this.name,
      this.endsAt,
      this.approved,
      this.weight,
      this.locale,
      this.timezone,
      this.version,
      this.country,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched flight budget in status open. */
export function newBatchedFlightBudget(code: string, name: string): BatchedFlightBudget {
  return new BatchedFlightBudget(code, name, 0, false, 0, "", "", 0, "", "", "open");
}
