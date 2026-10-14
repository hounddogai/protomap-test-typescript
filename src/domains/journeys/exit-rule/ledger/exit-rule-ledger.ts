/**
 * The exit rule ledger records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule ledger is in its life cycle. */
export type ExitRuleLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a exit rule ledger and its current status. */
export class ExitRuleLedger {
  code: string;
  title: string;
  discount: number;
  updatedAt: number;
  frequencyCap: number;
  status: ExitRuleLedgerStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    updatedAt: number,
    frequencyCap: number,
    status: ExitRuleLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: ExitRuleLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.discount + this.updatedAt) * 100) / 100;
  }

  copy(): ExitRuleLedger {
    return new ExitRuleLedger(this.code, this.title, this.discount, this.updatedAt, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule ledger in status idle. */
export function newExitRuleLedger(code: string, title: string): ExitRuleLedger {
  return new ExitRuleLedger(code, title, 0, 0, 0, "idle");
}
