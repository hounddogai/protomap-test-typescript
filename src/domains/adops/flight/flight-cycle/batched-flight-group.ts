import * as text from "../../../../kit/text.js";

/** Where a batched flight group is in its life cycle. */
export type BatchedFlightGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched flight group, with what the planners need to act on it. */
export class BatchedFlightGroup {
  code: string;
  label: string;
  reviewer: string;
  bid: number;
  name: string;
  ratio: number;
  amount: number;
  expiresAt: number;
  channel: string;
  approved: boolean;
  status: BatchedFlightGroupStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    bid: number,
    name: string,
    ratio: number,
    amount: number,
    expiresAt: number,
    channel: string,
    approved: boolean,
    status: BatchedFlightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.bid = bid;
    this.name = name;
    this.ratio = ratio;
    this.amount = amount;
    this.expiresAt = expiresAt;
    this.channel = channel;
    this.approved = approved;
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

  canMoveTo(next: BatchedFlightGroupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedFlightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched flight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.ratio - this.amount) * 100) / 100;
  }

  copy(): BatchedFlightGroup {
    return new BatchedFlightGroup(
      this.code,
      this.label,
      this.reviewer,
      this.bid,
      this.name,
      this.ratio,
      this.amount,
      this.expiresAt,
      this.channel,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched flight group in status open. */
export function newBatchedFlightGroup(code: string, label: string): BatchedFlightGroup {
  return new BatchedFlightGroup(code, label, "", 0, "", 0, 0, 0, "", false, "open");
}
