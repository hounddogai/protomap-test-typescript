import * as text from "../../../../kit/text.js";

/** Where a adaptive subscription review is in its life cycle. */
export type AdaptiveSubscriptionReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive subscription review as the subscription team keeps it. */
export class AdaptiveSubscriptionReview {
  code: string;
  name: string;
  cohort: string;
  cost: number;
  locale: string;
  amount: number;
  retries: number;
  status: AdaptiveSubscriptionReviewStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    cost: number,
    locale: string,
    amount: number,
    retries: number,
    status: AdaptiveSubscriptionReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.cost = cost;
    this.locale = locale;
    this.amount = amount;
    this.retries = retries;
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

  canMoveTo(next: AdaptiveSubscriptionReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveSubscriptionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive subscription review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.amount - this.retries) * 100) / 100;
  }

  copy(): AdaptiveSubscriptionReview {
    return new AdaptiveSubscriptionReview(
      this.code,
      this.name,
      this.cohort,
      this.cost,
      this.locale,
      this.amount,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive subscription review in status proposed. */
export function newAdaptiveSubscriptionReview(code: string, name: string): AdaptiveSubscriptionReview {
  return new AdaptiveSubscriptionReview(code, name, "", 0, "", 0, 0, "proposed");
}
