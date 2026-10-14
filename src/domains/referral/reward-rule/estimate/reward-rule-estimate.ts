/**
 * The reward rule estimate records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule estimate is in its life cycle. */
export type RewardRuleEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule estimate. Its code is unique within a tenant. */
export class RewardRuleEstimate {
  code: string;
  name: string;
  frequencyCap: number;
  maximum: number;
  threshold: number;
  visible: boolean;
  status: RewardRuleEstimateStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    maximum: number,
    threshold: number,
    visible: boolean,
    status: RewardRuleEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.maximum = maximum;
    this.threshold = threshold;
    this.visible = visible;
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

  canMoveTo(next: RewardRuleEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RewardRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reward rule estimate"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.frequencyCap * this.maximum * 100) / 100;
  }

  copy(): RewardRuleEstimate {
    return new RewardRuleEstimate(
      this.code,
      this.name,
      this.frequencyCap,
      this.maximum,
      this.threshold,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward rule estimate in status planned. */
export function newRewardRuleEstimate(code: string, name: string): RewardRuleEstimate {
  return new RewardRuleEstimate(code, name, 0, 0, 0, false, "planned");
}
