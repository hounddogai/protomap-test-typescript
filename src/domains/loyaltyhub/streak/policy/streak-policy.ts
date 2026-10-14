/**
 * The streak policy records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak policy is in its life cycle. */
export type StreakPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A streak policy as the streak team keeps it. */
export class StreakPolicy {
  code: string;
  name: string;
  budget: number;
  locale: string;
  ratio: number;
  status: StreakPolicyStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    locale: string,
    ratio: number,
    status: StreakPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.locale = locale;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round((this.budget - this.ratio) * 100) / 100;
  }

  copy(): StreakPolicy {
    return new StreakPolicy(this.code, this.name, this.budget, this.locale, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a streak policy in status proposed. */
export function newStreakPolicy(code: string, name: string): StreakPolicy {
  return new StreakPolicy(code, name, 0, "", 0, "proposed");
}
