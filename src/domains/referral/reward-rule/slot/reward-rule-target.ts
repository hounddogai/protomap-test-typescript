import * as text from "../../../../kit/text.js";

/** Where a reward rule target is in its life cycle. */
export type RewardRuleTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A reward rule target as the reward rule team keeps it. */
export class RewardRuleTarget {
  code: string;
  label: string;
  timezone: string;
  journeyId: string;
  region: string;
  amount: number;
  status: RewardRuleTargetStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    journeyId: string,
    region: string,
    amount: number,
    status: RewardRuleTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.journeyId = journeyId;
    this.region = region;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RewardRuleTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): RewardRuleTarget {
    return new RewardRuleTarget(
      this.code,
      this.label,
      this.timezone,
      this.journeyId,
      this.region,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reward rule target in status draft. */
export function newRewardRuleTarget(code: string, label: string): RewardRuleTarget {
  return new RewardRuleTarget(code, label, "", "", "", 0, "draft");
}
