/**
 * The default branch ledger records of journeys's branch work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default branch ledger is in its life cycle. */
export type DefaultBranchLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a default branch ledger and its current status. */
export class DefaultBranchLedger {
  code: string;
  title: string;
  sequence: number;
  ownerId: string;
  limit: number;
  status: DefaultBranchLedgerStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    ownerId: string,
    limit: number,
    status: DefaultBranchLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.ownerId = ownerId;
    this.limit = limit;
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

  canMoveTo(next: DefaultBranchLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultBranchLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default branch ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default branch ledger"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.limit * this.sequence * 100) / 100;
  }

  copy(): DefaultBranchLedger {
    return new DefaultBranchLedger(this.code, this.title, this.sequence, this.ownerId, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default branch ledger in status open. */
export function newDefaultBranchLedger(code: string, title: string): DefaultBranchLedger {
  return new DefaultBranchLedger(code, title, 0, "", 0, "open");
}
