/**
 * The reward rule claim records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule claim is in its life cycle. */
export type RewardRuleClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One reward rule claim, with what the planners need to act on it. */
export class RewardRuleClaim {
  code: string;
  label: string;
  source: string;
  phone: string;
  limit: number;
  status: RewardRuleClaimStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    phone: string,
    limit: number,
    status: RewardRuleClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.phone = phone;
    this.limit = limit;
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

  canMoveTo(next: RewardRuleClaimStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): RewardRuleClaim {
    return new RewardRuleClaim(this.code, this.label, this.source, this.phone, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reward rule claim in status open. */
export function newRewardRuleClaim(code: string, label: string): RewardRuleClaim {
  return new RewardRuleClaim(code, label, "", "", 0, "open");
}
