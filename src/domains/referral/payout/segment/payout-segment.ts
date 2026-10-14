/**
 * The payout segment records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout segment is in its life cycle. */
export type PayoutSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a payout segment and its current status. */
export class PayoutSegment {
  code: string;
  label: string;
  cohort: string;
  description: string;
  weight: number;
  expiresAt: number;
  discount: number;
  ceiling: number;
  frequencyCap: number;
  amount: number;
  status: PayoutSegmentStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    description: string,
    weight: number,
    expiresAt: number,
    discount: number,
    ceiling: number,
    frequencyCap: number,
    amount: number,
    status: PayoutSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.description = description;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.amount = amount;
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

  canMoveTo(next: PayoutSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PayoutSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"payout segment"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.weight * this.frequencyCap * 100) / 100;
  }

  copy(): PayoutSegment {
    return new PayoutSegment(
      this.code,
      this.label,
      this.cohort,
      this.description,
      this.weight,
      this.expiresAt,
      this.discount,
      this.ceiling,
      this.frequencyCap,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a payout segment in status proposed. */
export function newPayoutSegment(code: string, label: string): PayoutSegment {
  return new PayoutSegment(code, label, "", "", 0, 0, 0, 0, 0, 0, "proposed");
}
