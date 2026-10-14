import * as text from "../../../../kit/text.js";

/** Where a reward rule plan is in its life cycle. */
export type RewardRulePlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reward rule plan as the reward rule team keeps it. */
export class RewardRulePlan {
  code: string;
  title: string;
  discount: number;
  startsAt: number;
  checksum: string;
  retries: number;
  maximum: number;
  externalRef: string;
  margin: number;
  status: RewardRulePlanStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    startsAt: number,
    checksum: string,
    retries: number,
    maximum: number,
    externalRef: string,
    margin: number,
    status: RewardRulePlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.startsAt = startsAt;
    this.checksum = checksum;
    this.retries = retries;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.margin = margin;
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

  canMoveTo(next: RewardRulePlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RewardRulePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round(this.startsAt * this.discount * 100) / 100;
  }

  copy(): RewardRulePlan {
    return new RewardRulePlan(
      this.code,
      this.title,
      this.discount,
      this.startsAt,
      this.checksum,
      this.retries,
      this.maximum,
      this.externalRef,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward rule plan in status open. */
export function newRewardRulePlan(code: string, title: string): RewardRulePlan {
  return new RewardRulePlan(code, title, 0, 0, "", 0, 0, "", 0, "open");
}
