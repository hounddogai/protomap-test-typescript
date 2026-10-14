import * as text from "../../../../kit/text.js";

/** Where a strict subscription review is in its life cycle. */
export type StrictSubscriptionReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a strict subscription review and its current status. */
export class StrictSubscriptionReview {
  code: string;
  label: string;
  windowDays: number;
  ceiling: number;
  rate: number;
  description: string;
  category: string;
  audienceId: string;
  status: StrictSubscriptionReviewStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    ceiling: number,
    rate: number,
    description: string,
    category: string,
    audienceId: string,
    status: StrictSubscriptionReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.ceiling = ceiling;
    this.rate = rate;
    this.description = description;
    this.category = category;
    this.audienceId = audienceId;
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

  canMoveTo(next: StrictSubscriptionReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictSubscriptionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict subscription review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netTotal(): number {
    return Math.round((this.ceiling + this.windowDays) * 100) / 100;
  }

  copy(): StrictSubscriptionReview {
    return new StrictSubscriptionReview(
      this.code,
      this.label,
      this.windowDays,
      this.ceiling,
      this.rate,
      this.description,
      this.category,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict subscription review in status proposed. */
export function newStrictSubscriptionReview(code: string, label: string): StrictSubscriptionReview {
  return new StrictSubscriptionReview(code, label, 0, 0, 0, "", "", "", "proposed");
}
