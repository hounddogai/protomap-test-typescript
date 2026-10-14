/**
 * The batched opt out plan records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched opt out plan is in its life cycle. */
export type BatchedOptOutPlanStatus = "created" | "validated" | "published" | "retired";

/** One batched opt out plan, with what the planners need to act on it. */
export class BatchedOptOutPlan {
  code: string;
  label: string;
  source: string;
  approved: boolean;
  sequence: number;
  status: BatchedOptOutPlanStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    approved: boolean,
    sequence: number,
    status: BatchedOptOutPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.approved = approved;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedOptOutPlanStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedOptOutPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched opt out plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): BatchedOptOutPlan {
    return new BatchedOptOutPlan(this.code, this.label, this.source, this.approved, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched opt out plan in status created. */
export function newBatchedOptOutPlan(code: string, label: string): BatchedOptOutPlan {
  return new BatchedOptOutPlan(code, label, "", false, 0, "created");
}
