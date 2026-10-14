/**
 * The payout schedule records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout schedule is in its life cycle. */
export type PayoutScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a payout schedule and its current status. */
export class PayoutSchedule {
  code: string;
  name: string;
  clicks: number;
  cost: number;
  summary: string;
  budget: number;
  score: number;
  status: PayoutScheduleStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    cost: number,
    summary: string,
    budget: number,
    score: number,
    status: PayoutScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.cost = cost;
    this.summary = summary;
    this.budget = budget;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PayoutScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.clicks * 100) / 100;
  }

  copy(): PayoutSchedule {
    return new PayoutSchedule(
      this.code,
      this.name,
      this.clicks,
      this.cost,
      this.summary,
      this.budget,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout schedule in status new. */
export function newPayoutSchedule(code: string, name: string): PayoutSchedule {
  return new PayoutSchedule(code, name, 0, 0, "", 0, 0, "new");
}
