/**
 * The payout checkpoint records of referral's payout work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout checkpoint is in its life cycle. */
export type PayoutCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One payout checkpoint, with what the planners need to act on it. */
export class PayoutCheckpoint {
  code: string;
  name: string;
  cost: number;
  capacity: number;
  region: string;
  reviewer: string;
  status: PayoutCheckpointStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    capacity: number,
    region: string,
    reviewer: string,
    status: PayoutCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.capacity = capacity;
    this.region = region;
    this.reviewer = reviewer;
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

  canMoveTo(next: PayoutCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
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

  moveTo(next: PayoutCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round((this.cost - this.capacity) * 100) / 100;
  }

  copy(): PayoutCheckpoint {
    return new PayoutCheckpoint(
      this.code,
      this.name,
      this.cost,
      this.capacity,
      this.region,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a payout checkpoint in status open. */
export function newPayoutCheckpoint(code: string, name: string): PayoutCheckpoint {
  return new PayoutCheckpoint(code, name, 0, 0, "", "", "open");
}
