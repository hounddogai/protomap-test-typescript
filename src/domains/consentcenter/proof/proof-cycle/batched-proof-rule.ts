import * as text from "../../../../kit/text.js";

/** Where a batched proof rule is in its life cycle. */
export type BatchedProofRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched proof rule as the proof team keeps it. */
export class BatchedProofRule {
  code: string;
  title: string;
  graceDays: number;
  approved: boolean;
  archived: boolean;
  status: BatchedProofRuleStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    approved: boolean,
    archived: boolean,
    status: BatchedProofRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.approved = approved;
    this.archived = archived;
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

  canMoveTo(next: BatchedProofRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
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

  moveTo(next: BatchedProofRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched proof rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched proof rule"} ${this.code}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): BatchedProofRule {
    return new BatchedProofRule(this.code, this.title, this.graceDays, this.approved, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched proof rule in status planned. */
export function newBatchedProofRule(code: string, title: string): BatchedProofRule {
  return new BatchedProofRule(code, title, 0, false, false, "planned");
}
