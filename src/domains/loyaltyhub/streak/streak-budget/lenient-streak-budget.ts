/**
 * The lenient streak budget records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient streak budget is in its life cycle. */
export type LenientStreakBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient streak budget as the streak team keeps it. */
export class LenientStreakBudget {
  code: string;
  title: string;
  channel: string;
  priority: number;
  discount: number;
  status: LenientStreakBudgetStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    priority: number,
    discount: number,
    status: LenientStreakBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.priority = priority;
    this.discount = discount;
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

  canMoveTo(next: LenientStreakBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientStreakBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient streak budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient streak budget"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.priority - this.discount) * 100) / 100;
  }

  copy(): LenientStreakBudget {
    return new LenientStreakBudget(this.code, this.title, this.channel, this.priority, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient streak budget in status new. */
export function newLenientStreakBudget(code: string, title: string): LenientStreakBudget {
  return new LenientStreakBudget(code, title, "", 0, 0, "new");
}
