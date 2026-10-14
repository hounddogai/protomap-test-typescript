/**
 * The global window ledger records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global window ledger is in its life cycle. */
export type GlobalWindowLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global window ledger as the window team keeps it. */
export class GlobalWindowLedger {
  code: string;
  title: string;
  margin: number;
  visible: boolean;
  capacity: number;
  budget: number;
  status: GlobalWindowLedgerStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    visible: boolean,
    capacity: number,
    budget: number,
    status: GlobalWindowLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.visible = visible;
    this.capacity = capacity;
    this.budget = budget;
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

  canMoveTo(next: GlobalWindowLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalWindowLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global window ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.capacity * this.margin * 100) / 100;
  }

  copy(): GlobalWindowLedger {
    return new GlobalWindowLedger(
      this.code,
      this.title,
      this.margin,
      this.visible,
      this.capacity,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global window ledger in status open. */
export function newGlobalWindowLedger(code: string, title: string): GlobalWindowLedger {
  return new GlobalWindowLedger(code, title, 0, false, 0, 0, "open");
}
