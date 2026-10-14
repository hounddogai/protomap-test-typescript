import * as text from "../../../../kit/text.js";

/** Where a batched credit rule is in its life cycle. */
export type BatchedCreditRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One batched credit rule, with what the planners need to act on it. */
export class BatchedCreditRule {
  code: string;
  title: string;
  variant: string;
  pinned: boolean;
  segment: string;
  budget: number;
  graceDays: number;
  sendAt: number;
  retries: number;
  country: string;
  status: BatchedCreditRuleStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    pinned: boolean,
    segment: string,
    budget: number,
    graceDays: number,
    sendAt: number,
    retries: number,
    country: string,
    status: BatchedCreditRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.pinned = pinned;
    this.segment = segment;
    this.budget = budget;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.retries = retries;
    this.country = country;
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

  canMoveTo(next: BatchedCreditRuleStatus): boolean {
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
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedCreditRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched credit rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.budget - this.graceDays) * 100) / 100;
  }

  copy(): BatchedCreditRule {
    return new BatchedCreditRule(
      this.code,
      this.title,
      this.variant,
      this.pinned,
      this.segment,
      this.budget,
      this.graceDays,
      this.sendAt,
      this.retries,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched credit rule in status planned. */
export function newBatchedCreditRule(code: string, title: string): BatchedCreditRule {
  return new BatchedCreditRule(code, title, "", false, "", 0, 0, 0, 0, "", "planned");
}
