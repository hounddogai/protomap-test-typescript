/**
 * The reward rule policy records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule policy is in its life cycle. */
export type RewardRulePolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule policy. Its code is unique within a tenant. */
export class RewardRulePolicy {
  code: string;
  label: string;
  floorValue: number;
  threshold: number;
  updatedAt: number;
  name: string;
  journeyId: string;
  variant: string;
  approved: boolean;
  retries: number;
  status: RewardRulePolicyStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    threshold: number,
    updatedAt: number,
    name: string,
    journeyId: string,
    variant: string,
    approved: boolean,
    retries: number,
    status: RewardRulePolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.threshold = threshold;
    this.updatedAt = updatedAt;
    this.name = name;
    this.journeyId = journeyId;
    this.variant = variant;
    this.approved = approved;
    this.retries = retries;
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

  canMoveTo(next: RewardRulePolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRulePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.floorValue + this.updatedAt) * 100) / 100;
  }

  copy(): RewardRulePolicy {
    return new RewardRulePolicy(
      this.code,
      this.label,
      this.floorValue,
      this.threshold,
      this.updatedAt,
      this.name,
      this.journeyId,
      this.variant,
      this.approved,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward rule policy in status planned. */
export function newRewardRulePolicy(code: string, label: string): RewardRulePolicy {
  return new RewardRulePolicy(code, label, 0, 0, 0, "", "", "", false, 0, "planned");
}
