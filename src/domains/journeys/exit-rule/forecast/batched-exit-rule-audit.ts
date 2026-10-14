import * as text from "../../../../kit/text.js";

/** Where a batched exit rule audit is in its life cycle. */
export type BatchedExitRuleAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a batched exit rule audit and its current status. */
export class BatchedExitRuleAudit {
  code: string;
  title: string;
  impressions: number;
  createdAt: number;
  rate: number;
  status: BatchedExitRuleAuditStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    createdAt: number,
    rate: number,
    status: BatchedExitRuleAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.createdAt = createdAt;
    this.rate = rate;
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

  canMoveTo(next: BatchedExitRuleAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BatchedExitRuleAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched exit rule audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched exit rule audit"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.rate + this.impressions) * 100) / 100;
  }

  copy(): BatchedExitRuleAudit {
    return new BatchedExitRuleAudit(this.code, this.title, this.impressions, this.createdAt, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched exit rule audit in status draft. */
export function newBatchedExitRuleAudit(code: string, title: string): BatchedExitRuleAudit {
  return new BatchedExitRuleAudit(code, title, 0, 0, 0, "draft");
}
