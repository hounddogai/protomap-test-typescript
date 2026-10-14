/**
 * The payout cycle records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout cycle is in its life cycle. */
export type PayoutCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A payout cycle as the payout team keeps it. */
export class PayoutCycle {
  code: string;
  title: string;
  archived: boolean;
  revision: number;
  amount: number;
  country: string;
  status: PayoutCycleStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    revision: number,
    amount: number,
    country: string,
    status: PayoutCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.revision = revision;
    this.amount = amount;
    this.country = country;
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

  canMoveTo(next: PayoutCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PayoutCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.revision * this.amount * 100) / 100;
  }

  copy(): PayoutCycle {
    return new PayoutCycle(this.code, this.title, this.archived, this.revision, this.amount, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a payout cycle in status planned. */
export function newPayoutCycle(code: string, title: string): PayoutCycle {
  return new PayoutCycle(code, title, false, 0, 0, "", "planned");
}
