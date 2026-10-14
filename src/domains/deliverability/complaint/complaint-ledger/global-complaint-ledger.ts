/**
 * The global complaint ledger records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global complaint ledger is in its life cycle. */
export type GlobalComplaintLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global complaint ledger as the complaint team keeps it. */
export class GlobalComplaintLedger {
  code: string;
  label: string;
  cost: number;
  phone: string;
  conversionRate: number;
  amount: number;
  bid: number;
  externalRef: string;
  active: boolean;
  status: GlobalComplaintLedgerStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    phone: string,
    conversionRate: number,
    amount: number,
    bid: number,
    externalRef: string,
    active: boolean,
    status: GlobalComplaintLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.amount = amount;
    this.bid = bid;
    this.externalRef = externalRef;
    this.active = active;
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

  canMoveTo(next: GlobalComplaintLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: GlobalComplaintLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global complaint ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global complaint ledger"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.bid * this.amount * 100) / 100;
  }

  copy(): GlobalComplaintLedger {
    return new GlobalComplaintLedger(
      this.code,
      this.label,
      this.cost,
      this.phone,
      this.conversionRate,
      this.amount,
      this.bid,
      this.externalRef,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global complaint ledger in status new. */
export function newGlobalComplaintLedger(code: string, label: string): GlobalComplaintLedger {
  return new GlobalComplaintLedger(code, label, 0, "", 0, 0, 0, "", false, "new");
}
