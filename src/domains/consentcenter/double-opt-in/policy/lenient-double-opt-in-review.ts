import * as text from "../../../../kit/text.js";

/** Where a lenient double opt in review is in its life cycle. */
export type LenientDoubleOptInReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient double opt in review as the double opt in team keeps it. */
export class LenientDoubleOptInReview {
  code: string;
  name: string;
  currency: string;
  pinned: boolean;
  attempts: number;
  openRate: number;
  graceDays: number;
  variant: string;
  status: LenientDoubleOptInReviewStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    pinned: boolean,
    attempts: number,
    openRate: number,
    graceDays: number,
    variant: string,
    status: LenientDoubleOptInReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.pinned = pinned;
    this.attempts = attempts;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.variant = variant;
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

  canMoveTo(next: LenientDoubleOptInReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientDoubleOptInReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient double opt in review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round(this.attempts * this.openRate * 100) / 100;
  }

  copy(): LenientDoubleOptInReview {
    return new LenientDoubleOptInReview(
      this.code,
      this.name,
      this.currency,
      this.pinned,
      this.attempts,
      this.openRate,
      this.graceDays,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient double opt in review in status proposed. */
export function newLenientDoubleOptInReview(code: string, name: string): LenientDoubleOptInReview {
  return new LenientDoubleOptInReview(code, name, "", false, 0, 0, 0, "", "proposed");
}
