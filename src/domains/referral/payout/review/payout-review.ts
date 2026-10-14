/**
 * The payout review records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout review is in its life cycle. */
export type PayoutReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A payout review. Its code is unique within a tenant. */
export class PayoutReview {
  code: string;
  label: string;
  weight: number;
  budget: number;
  locale: string;
  reviewer: string;
  externalRef: string;
  notes: string;
  summary: string;
  status: PayoutReviewStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    budget: number,
    locale: string,
    reviewer: string,
    externalRef: string,
    notes: string,
    summary: string,
    status: PayoutReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.budget = budget;
    this.locale = locale;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.notes = notes;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PayoutReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.budget + this.weight) * 100) / 100;
  }

  copy(): PayoutReview {
    return new PayoutReview(
      this.code,
      this.label,
      this.weight,
      this.budget,
      this.locale,
      this.reviewer,
      this.externalRef,
      this.notes,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout review in status requested. */
export function newPayoutReview(code: string, label: string): PayoutReview {
  return new PayoutReview(code, label, 0, 0, "", "", "", "", "", "requested");
}
