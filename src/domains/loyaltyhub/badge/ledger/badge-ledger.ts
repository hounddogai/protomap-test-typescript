/**
 * The badge ledger records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge ledger is in its life cycle. */
export type BadgeLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A badge ledger. Its code is unique within a tenant. */
export class BadgeLedger {
  code: string;
  name: string;
  pinned: boolean;
  description: string;
  quantity: number;
  status: BadgeLedgerStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    description: string,
    quantity: number,
    status: BadgeLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.description = description;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): BadgeLedger {
    return new BadgeLedger(this.code, this.name, this.pinned, this.description, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge ledger in status idle. */
export function newBadgeLedger(code: string, name: string): BadgeLedger {
  return new BadgeLedger(code, name, false, "", 0, "idle");
}
