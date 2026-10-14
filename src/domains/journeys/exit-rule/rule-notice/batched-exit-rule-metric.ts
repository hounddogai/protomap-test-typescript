import * as text from "../../../../kit/text.js";

/** Where a batched exit rule metric is in its life cycle. */
export type BatchedExitRuleMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched exit rule metric. Its code is unique within a tenant. */
export class BatchedExitRuleMetric {
  code: string;
  title: string;
  locale: string;
  ratio: number;
  budget: number;
  status: BatchedExitRuleMetricStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    ratio: number,
    budget: number,
    status: BatchedExitRuleMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.ratio = ratio;
    this.budget = budget;
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

  canMoveTo(next: BatchedExitRuleMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedExitRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched exit rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched exit rule metric"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.ratio + this.budget) * 100) / 100;
  }

  copy(): BatchedExitRuleMetric {
    return new BatchedExitRuleMetric(this.code, this.title, this.locale, this.ratio, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched exit rule metric in status planned. */
export function newBatchedExitRuleMetric(code: string, title: string): BatchedExitRuleMetric {
  return new BatchedExitRuleMetric(code, title, "", 0, 0, "planned");
}
