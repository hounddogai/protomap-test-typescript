import * as text from "../../../../kit/text.js";

/** Where a bid rule review is in its life cycle. */
export type BidRuleReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a bid rule review and its current status. */
export class BidRuleReview {
  code: string;
  title: string;
  visible: boolean;
  locale: string;
  country: string;
  minimum: number;
  pinned: boolean;
  revision: number;
  ratio: number;
  variant: string;
  status: BidRuleReviewStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    locale: string,
    country: string,
    minimum: number,
    pinned: boolean,
    revision: number,
    ratio: number,
    variant: string,
    status: BidRuleReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.locale = locale;
    this.country = country;
    this.minimum = minimum;
    this.pinned = pinned;
    this.revision = revision;
    this.ratio = ratio;
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

  canMoveTo(next: BidRuleReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BidRuleReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"bid rule review"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.revision - this.ratio) * 100) / 100;
  }

  copy(): BidRuleReview {
    return new BidRuleReview(
      this.code,
      this.title,
      this.visible,
      this.locale,
      this.country,
      this.minimum,
      this.pinned,
      this.revision,
      this.ratio,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bid rule review in status proposed. */
export function newBidRuleReview(code: string, title: string): BidRuleReview {
  return new BidRuleReview(code, title, false, "", "", 0, false, 0, 0, "", "proposed");
}
