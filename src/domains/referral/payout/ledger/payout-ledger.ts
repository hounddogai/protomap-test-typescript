/**
 * The payout ledger records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout ledger is in its life cycle. */
export type PayoutLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One payout ledger, with what the planners need to act on it. */
export class PayoutLedger {
  code: string;
  label: string;
  campaignRef: string;
  locale: string;
  score: number;
  budget: number;
  summary: string;
  priority: number;
  status: PayoutLedgerStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    locale: string,
    score: number,
    budget: number,
    summary: string,
    priority: number,
    status: PayoutLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.score = score;
    this.budget = budget;
    this.summary = summary;
    this.priority = priority;
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

  canMoveTo(next: PayoutLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PayoutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedValue(): number {
    return Math.round((this.score - this.budget) * 100) / 100;
  }

  copy(): PayoutLedger {
    return new PayoutLedger(
      this.code,
      this.label,
      this.campaignRef,
      this.locale,
      this.score,
      this.budget,
      this.summary,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout ledger in status draft. */
export function newPayoutLedger(code: string, label: string): PayoutLedger {
  return new PayoutLedger(code, label, "", "", 0, 0, "", 0, "draft");
}
