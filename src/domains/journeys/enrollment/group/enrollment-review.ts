import * as text from "../../../../kit/text.js";

/** Where a enrollment review is in its life cycle. */
export type EnrollmentReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One enrollment review, with what the planners need to act on it. */
export class EnrollmentReview {
  code: string;
  name: string;
  label: string;
  amount: number;
  openRate: number;
  graceDays: number;
  locale: string;
  segment: string;
  region: string;
  status: EnrollmentReviewStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    amount: number,
    openRate: number,
    graceDays: number,
    locale: string,
    segment: string,
    region: string,
    status: EnrollmentReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.amount = amount;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.locale = locale;
    this.segment = segment;
    this.region = region;
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

  canMoveTo(next: EnrollmentReviewStatus): boolean {
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

  moveTo(next: EnrollmentReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"enrollment review"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays - this.openRate) * 100) / 100;
  }

  copy(): EnrollmentReview {
    return new EnrollmentReview(
      this.code,
      this.name,
      this.label,
      this.amount,
      this.openRate,
      this.graceDays,
      this.locale,
      this.segment,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a enrollment review in status proposed. */
export function newEnrollmentReview(code: string, name: string): EnrollmentReview {
  return new EnrollmentReview(code, name, "", 0, 0, 0, "", "", "", "proposed");
}
