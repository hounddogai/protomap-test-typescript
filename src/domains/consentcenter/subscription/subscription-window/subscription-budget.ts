import * as text from "../../../../kit/text.js";

/** Where a subscription budget is in its life cycle. */
export type SubscriptionBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A subscription budget. Its code is unique within a tenant. */
export class SubscriptionBudget {
  code: string;
  title: string;
  amount: number;
  version: number;
  audienceId: string;
  ceiling: number;
  status: SubscriptionBudgetStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    version: number,
    audienceId: string,
    ceiling: number,
    status: SubscriptionBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.version = version;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
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

  canMoveTo(next: SubscriptionBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SubscriptionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"subscription budget"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.ceiling + this.amount) * 100) / 100;
  }

  copy(): SubscriptionBudget {
    return new SubscriptionBudget(
      this.code,
      this.title,
      this.amount,
      this.version,
      this.audienceId,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a subscription budget in status planned. */
export function newSubscriptionBudget(code: string, title: string): SubscriptionBudget {
  return new SubscriptionBudget(code, title, 0, 0, "", 0, "planned");
}
