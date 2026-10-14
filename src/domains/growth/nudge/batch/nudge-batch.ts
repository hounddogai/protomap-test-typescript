/**
 * The nudge batch records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge batch is in its life cycle. */
export type NudgeBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** One nudge batch, with what the planners need to act on it. */
export class NudgeBatch {
  code: string;
  label: string;
  checksum: string;
  reviewer: string;
  category: string;
  amount: number;
  status: NudgeBatchStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    reviewer: string,
    category: string,
    amount: number,
    status: NudgeBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.reviewer = reviewer;
    this.category = category;
    this.amount = amount;
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

  canMoveTo(next: NudgeBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"nudge batch"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): NudgeBatch {
    return new NudgeBatch(this.code, this.label, this.checksum, this.reviewer, this.category, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a nudge batch in status new. */
export function newNudgeBatch(code: string, label: string): NudgeBatch {
  return new NudgeBatch(code, label, "", "", "", 0, "new");
}
