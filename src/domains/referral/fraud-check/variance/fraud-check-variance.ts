/**
 * The fraud check variance records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check variance is in its life cycle. */
export type FraudCheckVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fraud check variance and its current status. */
export class FraudCheckVariance {
  code: string;
  label: string;
  discount: number;
  cohort: string;
  variant: string;
  locale: string;
  currency: string;
  notes: string;
  conversionRate: number;
  minimum: number;
  status: FraudCheckVarianceStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    cohort: string,
    variant: string,
    locale: string,
    currency: string,
    notes: string,
    conversionRate: number,
    minimum: number,
    status: FraudCheckVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.cohort = cohort;
    this.variant = variant;
    this.locale = locale;
    this.currency = currency;
    this.notes = notes;
    this.conversionRate = conversionRate;
    this.minimum = minimum;
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

  canMoveTo(next: FraudCheckVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: FraudCheckVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.discount - this.conversionRate) * 100) / 100;
  }

  copy(): FraudCheckVariance {
    return new FraudCheckVariance(
      this.code,
      this.label,
      this.discount,
      this.cohort,
      this.variant,
      this.locale,
      this.currency,
      this.notes,
      this.conversionRate,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fraud check variance in status proposed. */
export function newFraudCheckVariance(code: string, label: string): FraudCheckVariance {
  return new FraudCheckVariance(code, label, 0, "", "", "", "", "", 0, 0, "proposed");
}
