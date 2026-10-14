/**
 * The batched branch template records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched branch template is in its life cycle. */
export type BatchedBranchTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a batched branch template and its current status. */
export class BatchedBranchTemplate {
  code: string;
  label: string;
  visible: boolean;
  pinned: boolean;
  score: number;
  status: BatchedBranchTemplateStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    pinned: boolean,
    score: number,
    status: BatchedBranchTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.pinned = pinned;
    this.score = score;
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

  canMoveTo(next: BatchedBranchTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedBranchTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched branch template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BatchedBranchTemplate {
    return new BatchedBranchTemplate(this.code, this.label, this.visible, this.pinned, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched branch template in status planned. */
export function newBatchedBranchTemplate(code: string, label: string): BatchedBranchTemplate {
  return new BatchedBranchTemplate(code, label, false, false, 0, "planned");
}
