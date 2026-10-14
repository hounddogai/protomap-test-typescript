/**
 * The strict reward rule claim records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict reward rule claim is in its life cycle. */
export type StrictRewardRuleClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One strict reward rule claim, with what the planners need to act on it. */
export class StrictRewardRuleClaim {
  code: string;
  name: string;
  campaignRef: string;
  conversionRate: number;
  startsAt: number;
  ratio: number;
  status: StrictRewardRuleClaimStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    conversionRate: number,
    startsAt: number,
    ratio: number,
    status: StrictRewardRuleClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
    this.ratio = ratio;
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

  canMoveTo(next: StrictRewardRuleClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictRewardRuleClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward rule claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round(this.startsAt * this.ratio * 100) / 100;
  }

  copy(): StrictRewardRuleClaim {
    return new StrictRewardRuleClaim(
      this.code,
      this.name,
      this.campaignRef,
      this.conversionRate,
      this.startsAt,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict reward rule claim in status planned. */
export function newStrictRewardRuleClaim(code: string, name: string): StrictRewardRuleClaim {
  return new StrictRewardRuleClaim(code, name, "", 0, 0, 0, "planned");
}
