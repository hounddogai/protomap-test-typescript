import * as text from "../../../../kit/text.js";

/** Where a batched wait rule is in its life cycle. */
export type BatchedWaitRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a batched wait rule and its current status. */
export class BatchedWaitRule {
  code: string;
  title: string;
  impressions: number;
  limit: number;
  version: number;
  status: BatchedWaitRuleStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    limit: number,
    version: number,
    status: BatchedWaitRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.limit = limit;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedWaitRuleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BatchedWaitRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched wait rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.version + this.limit) * 100) / 100;
  }

  copy(): BatchedWaitRule {
    return new BatchedWaitRule(this.code, this.title, this.impressions, this.limit, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched wait rule in status new. */
export function newBatchedWaitRule(code: string, title: string): BatchedWaitRule {
  return new BatchedWaitRule(code, title, 0, 0, 0, "new");
}
