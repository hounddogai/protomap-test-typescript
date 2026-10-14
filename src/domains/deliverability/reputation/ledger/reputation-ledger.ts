/**
 * The reputation ledger records of deliverability's reputation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation ledger is in its life cycle. */
export type ReputationLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** One reputation ledger, with what the planners need to act on it. */
export class ReputationLedger {
  code: string;
  label: string;
  notes: string;
  campaignRef: string;
  score: number;
  status: ReputationLedgerStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    campaignRef: string,
    score: number,
    status: ReputationLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.score = score;
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

  canMoveTo(next: ReputationLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "failed";
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

  moveTo(next: ReputationLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ReputationLedger {
    return new ReputationLedger(this.code, this.label, this.notes, this.campaignRef, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation ledger in status new. */
export function newReputationLedger(code: string, label: string): ReputationLedger {
  return new ReputationLedger(code, label, "", "", 0, "new");
}
