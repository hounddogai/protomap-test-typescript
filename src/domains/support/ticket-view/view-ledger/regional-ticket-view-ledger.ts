/**
 * The regional ticket view ledger records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional ticket view ledger is in its life cycle. */
export type RegionalTicketViewLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional ticket view ledger as the ticket view team keeps it. */
export class RegionalTicketViewLedger {
  code: string;
  label: string;
  unit: string;
  weight: number;
  approved: boolean;
  pinned: boolean;
  status: RegionalTicketViewLedgerStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    weight: number,
    approved: boolean,
    pinned: boolean,
    status: RegionalTicketViewLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.weight = weight;
    this.approved = approved;
    this.pinned = pinned;
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

  canMoveTo(next: RegionalTicketViewLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalTicketViewLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional ticket view ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): RegionalTicketViewLedger {
    return new RegionalTicketViewLedger(
      this.code,
      this.label,
      this.unit,
      this.weight,
      this.approved,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a regional ticket view ledger in status open. */
export function newRegionalTicketViewLedger(code: string, label: string): RegionalTicketViewLedger {
  return new RegionalTicketViewLedger(code, label, "", 0, false, false, "open");
}
