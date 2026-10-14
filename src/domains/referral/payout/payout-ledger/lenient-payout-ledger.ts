/**
 * The lenient payout ledger records of referral's payout work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient payout ledger is in its life cycle. */
export type LenientPayoutLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient payout ledger. Its code is unique within a tenant. */
export class LenientPayoutLedger {
  code: string;
  title: string;
  notes: string;
  ceiling: number;
  variant: string;
  externalRef: string;
  phone: string;
  margin: number;
  durationMinutes: number;
  discount: number;
  floorValue: number;
  status: LenientPayoutLedgerStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    ceiling: number,
    variant: string,
    externalRef: string,
    phone: string,
    margin: number,
    durationMinutes: number,
    discount: number,
    floorValue: number,
    status: LenientPayoutLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.ceiling = ceiling;
    this.variant = variant;
    this.externalRef = externalRef;
    this.phone = phone;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPayoutLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPayoutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient payout ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.margin + this.durationMinutes) * 100) / 100;
  }

  copy(): LenientPayoutLedger {
    return new LenientPayoutLedger(
      this.code,
      this.title,
      this.notes,
      this.ceiling,
      this.variant,
      this.externalRef,
      this.phone,
      this.margin,
      this.durationMinutes,
      this.discount,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient payout ledger in status draft. */
export function newLenientPayoutLedger(code: string, title: string): LenientPayoutLedger {
  return new LenientPayoutLedger(code, title, "", 0, "", "", "", 0, 0, 0, 0, "draft");
}
