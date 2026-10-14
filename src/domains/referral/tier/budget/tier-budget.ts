/**
 * The tier budget records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier budget is in its life cycle. */
export type TierBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tier budget as the tier team keeps it. */
export class TierBudget {
  code: string;
  label: string;
  bid: number;
  priority: number;
  phone: string;
  graceDays: number;
  status: TierBudgetStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    priority: number,
    phone: string,
    graceDays: number,
    status: TierBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.priority = priority;
    this.phone = phone;
    this.graceDays = graceDays;
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

  canMoveTo(next: TierBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: TierBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round(this.priority * this.graceDays * 100) / 100;
  }

  copy(): TierBudget {
    return new TierBudget(this.code, this.label, this.bid, this.priority, this.phone, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tier budget in status planned. */
export function newTierBudget(code: string, label: string): TierBudget {
  return new TierBudget(code, label, 0, 0, "", 0, "planned");
}
