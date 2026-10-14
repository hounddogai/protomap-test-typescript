/**
 * The wait rule records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait rule is in its life cycle. */
export type WaitRuleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One wait rule, with what the planners need to act on it. */
export class WaitRule {
  code: string;
  title: string;
  cohort: string;
  amount: number;
  minimum: number;
  createdAt: number;
  region: string;
  maximum: number;
  tags: string[];
  discount: number;
  status: WaitRuleStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    amount: number,
    minimum: number,
    createdAt: number,
    region: string,
    maximum: number,
    tags: string[],
    discount: number,
    status: WaitRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.amount = amount;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.region = region;
    this.maximum = maximum;
    this.tags = tags;
    this.discount = discount;
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

  canMoveTo(next: WaitRuleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WaitRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"wait rule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.createdAt + this.amount) * 100) / 100;
  }

  copy(): WaitRule {
    return new WaitRule(
      this.code,
      this.title,
      this.cohort,
      this.amount,
      this.minimum,
      this.createdAt,
      this.region,
      this.maximum,
      this.tags,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a wait rule in status draft. */
export function newWaitRule(code: string, title: string): WaitRule {
  return new WaitRule(code, title, "", 0, 0, 0, "", 0, [], 0, "draft");
}
