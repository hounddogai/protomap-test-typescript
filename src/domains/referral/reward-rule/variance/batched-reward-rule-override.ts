import * as text from "../../../../kit/text.js";

/** Where a batched reward rule override is in its life cycle. */
export type BatchedRewardRuleOverrideStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched reward rule override as the reward rule team keeps it. */
export class BatchedRewardRuleOverride {
  code: string;
  name: string;
  openRate: number;
  phone: string;
  budget: number;
  summary: string;
  retries: number;
  category: string;
  visible: boolean;
  status: BatchedRewardRuleOverrideStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    phone: string,
    budget: number,
    summary: string,
    retries: number,
    category: string,
    visible: boolean,
    status: BatchedRewardRuleOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.phone = phone;
    this.budget = budget;
    this.summary = summary;
    this.retries = retries;
    this.category = category;
    this.visible = visible;
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

  canMoveTo(next: BatchedRewardRuleOverrideStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedRewardRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched reward rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.budget - this.openRate) * 100) / 100;
  }

  copy(): BatchedRewardRuleOverride {
    return new BatchedRewardRuleOverride(
      this.code,
      this.name,
      this.openRate,
      this.phone,
      this.budget,
      this.summary,
      this.retries,
      this.category,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched reward rule override in status open. */
export function newBatchedRewardRuleOverride(code: string, name: string): BatchedRewardRuleOverride {
  return new BatchedRewardRuleOverride(code, name, 0, "", 0, "", 0, "", false, "open");
}
