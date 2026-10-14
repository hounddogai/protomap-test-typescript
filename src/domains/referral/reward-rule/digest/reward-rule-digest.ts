/**
 * The reward rule digest records of referral's reward rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reward rule digest is in its life cycle. */
export type RewardRuleDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reward rule digest. Its code is unique within a tenant. */
export class RewardRuleDigest {
  code: string;
  title: string;
  expiresAt: number;
  cohort: string;
  windowDays: number;
  label: string;
  cost: number;
  status: RewardRuleDigestStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    cohort: string,
    windowDays: number,
    label: string,
    cost: number,
    status: RewardRuleDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.label = label;
    this.cost = cost;
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

  canMoveTo(next: RewardRuleDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: RewardRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  netTotal(): number {
    return Math.round(this.windowDays * this.cost * 100) / 100;
  }

  copy(): RewardRuleDigest {
    return new RewardRuleDigest(
      this.code,
      this.title,
      this.expiresAt,
      this.cohort,
      this.windowDays,
      this.label,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward rule digest in status planned. */
export function newRewardRuleDigest(code: string, title: string): RewardRuleDigest {
  return new RewardRuleDigest(code, title, 0, "", 0, "", 0, "planned");
}
