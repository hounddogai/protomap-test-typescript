/**
 * The deflection ledger records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection ledger is in its life cycle. */
export type DeflectionLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A deflection ledger. Its code is unique within a tenant. */
export class DeflectionLedger {
  code: string;
  name: string;
  visible: boolean;
  score: number;
  cost: number;
  bid: number;
  ceiling: number;
  status: DeflectionLedgerStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    score: number,
    cost: number,
    bid: number,
    ceiling: number,
    status: DeflectionLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.score = score;
    this.cost = cost;
    this.bid = bid;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection ledger"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.ceiling * this.bid * 100) / 100;
  }

  copy(): DeflectionLedger {
    return new DeflectionLedger(
      this.code,
      this.name,
      this.visible,
      this.score,
      this.cost,
      this.bid,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a deflection ledger in status proposed. */
export function newDeflectionLedger(code: string, name: string): DeflectionLedger {
  return new DeflectionLedger(code, name, false, 0, 0, 0, 0, "proposed");
}
