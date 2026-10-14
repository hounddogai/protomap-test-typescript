/**
 * The reward rule variance records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule variance is in its life cycle. */
export type RewardRuleVarianceStatus = "created" | "validated" | "published" | "retired";

/** A reward rule variance as the reward rule team keeps it. */
export class RewardRuleVariance {
  code: string;
  title: string;
  approved: boolean;
  revision: number;
  discount: number;
  createdAt: number;
  status: RewardRuleVarianceStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    revision: number,
    discount: number,
    createdAt: number,
    status: RewardRuleVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.revision = revision;
    this.discount = discount;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardRuleVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"reward rule variance"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.revision + this.createdAt) * 100) / 100;
  }

  copy(): RewardRuleVariance {
    return new RewardRuleVariance(
      this.code,
      this.title,
      this.approved,
      this.revision,
      this.discount,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward rule variance in status created. */
export function newRewardRuleVariance(code: string, title: string): RewardRuleVariance {
  return new RewardRuleVariance(code, title, false, 0, 0, 0, "created");
}
