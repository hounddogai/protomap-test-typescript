import * as text from "../../../../kit/text.js";

/** Where a batched insight plan is in its life cycle. */
export type BatchedInsightPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched insight plan, with what the planners need to act on it. */
export class BatchedInsightPlan {
  code: string;
  name: string;
  limit: number;
  locale: string;
  source: string;
  amount: number;
  currency: string;
  createdAt: number;
  status: BatchedInsightPlanStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    locale: string,
    source: string,
    amount: number,
    currency: string,
    createdAt: number,
    status: BatchedInsightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.locale = locale;
    this.source = source;
    this.amount = amount;
    this.currency = currency;
    this.createdAt = createdAt;
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

  canMoveTo(next: BatchedInsightPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
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

  moveTo(next: BatchedInsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round((this.amount - this.limit) * 100) / 100;
  }

  copy(): BatchedInsightPlan {
    return new BatchedInsightPlan(
      this.code,
      this.name,
      this.limit,
      this.locale,
      this.source,
      this.amount,
      this.currency,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched insight plan in status open. */
export function newBatchedInsightPlan(code: string, name: string): BatchedInsightPlan {
  return new BatchedInsightPlan(code, name, 0, "", "", 0, "", 0, "open");
}
