import * as text from "../../../../kit/text.js";

/** Where a subscription plan is in its life cycle. */
export type SubscriptionPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a subscription plan and its current status. */
export class SubscriptionPlan {
  code: string;
  name: string;
  tags: string[];
  graceDays: number;
  cost: number;
  status: SubscriptionPlanStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    graceDays: number,
    cost: number,
    status: SubscriptionPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.graceDays = graceDays;
    this.cost = cost;
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

  canMoveTo(next: SubscriptionPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SubscriptionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"subscription plan"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.graceDays - this.cost) * 100) / 100;
  }

  copy(): SubscriptionPlan {
    return new SubscriptionPlan(this.code, this.name, this.tags, this.graceDays, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a subscription plan in status open. */
export function newSubscriptionPlan(code: string, name: string): SubscriptionPlan {
  return new SubscriptionPlan(code, name, [], 0, 0, "open");
}
