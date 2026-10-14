import * as text from "../../../../kit/text.js";

/** Where a subscription rollup is in its life cycle. */
export type SubscriptionRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One subscription rollup, with what the planners need to act on it. */
export class SubscriptionRollup {
  code: string;
  name: string;
  expiresAt: number;
  priority: number;
  campaignRef: string;
  status: SubscriptionRollupStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    priority: number,
    campaignRef: string,
    status: SubscriptionRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: SubscriptionRollupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: SubscriptionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round((this.priority - this.expiresAt) * 100) / 100;
  }

  copy(): SubscriptionRollup {
    return new SubscriptionRollup(this.code, this.name, this.expiresAt, this.priority, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a subscription rollup in status open. */
export function newSubscriptionRollup(code: string, name: string): SubscriptionRollup {
  return new SubscriptionRollup(code, name, 0, 0, "", "open");
}
