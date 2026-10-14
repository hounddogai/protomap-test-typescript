import * as text from "../../../../kit/text.js";

/** Where a fraud check summary is in its life cycle. */
export type FraudCheckSummaryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One fraud check summary, with what the planners need to act on it. */
export class FraudCheckSummary {
  code: string;
  title: string;
  sendAt: number;
  unit: string;
  active: boolean;
  capacity: number;
  bid: number;
  budget: number;
  sequence: number;
  batchSize: number;
  status: FraudCheckSummaryStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    unit: string,
    active: boolean,
    capacity: number,
    bid: number,
    budget: number,
    sequence: number,
    batchSize: number,
    status: FraudCheckSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.unit = unit;
    this.active = active;
    this.capacity = capacity;
    this.bid = bid;
    this.budget = budget;
    this.sequence = sequence;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckSummaryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round(this.budget * this.batchSize * 100) / 100;
  }

  copy(): FraudCheckSummary {
    return new FraudCheckSummary(
      this.code,
      this.title,
      this.sendAt,
      this.unit,
      this.active,
      this.capacity,
      this.bid,
      this.budget,
      this.sequence,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fraud check summary in status draft. */
export function newFraudCheckSummary(code: string, title: string): FraudCheckSummary {
  return new FraudCheckSummary(code, title, 0, "", false, 0, 0, 0, 0, 0, "draft");
}
