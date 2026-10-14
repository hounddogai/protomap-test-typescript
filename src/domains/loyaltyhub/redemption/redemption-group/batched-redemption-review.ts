import * as text from "../../../../kit/text.js";

/** Where a batched redemption review is in its life cycle. */
export type BatchedRedemptionReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A batched redemption review as the redemption team keeps it. */
export class BatchedRedemptionReview {
  code: string;
  name: string;
  score: number;
  sendAt: number;
  label: string;
  unit: string;
  locale: string;
  source: string;
  ceiling: number;
  status: BatchedRedemptionReviewStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    sendAt: number,
    label: string,
    unit: string,
    locale: string,
    source: string,
    ceiling: number,
    status: BatchedRedemptionReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.sendAt = sendAt;
    this.label = label;
    this.unit = unit;
    this.locale = locale;
    this.source = source;
    this.ceiling = ceiling;
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

  canMoveTo(next: BatchedRedemptionReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: BatchedRedemptionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched redemption review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.sendAt + this.score) * 100) / 100;
  }

  copy(): BatchedRedemptionReview {
    return new BatchedRedemptionReview(
      this.code,
      this.name,
      this.score,
      this.sendAt,
      this.label,
      this.unit,
      this.locale,
      this.source,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched redemption review in status proposed. */
export function newBatchedRedemptionReview(code: string, name: string): BatchedRedemptionReview {
  return new BatchedRedemptionReview(code, name, 0, 0, "", "", "", "", 0, "proposed");
}
