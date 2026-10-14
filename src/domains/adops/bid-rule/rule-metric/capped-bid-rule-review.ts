import * as text from "../../../../kit/text.js";

/** Where a capped bid rule review is in its life cycle. */
export type CappedBidRuleReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a capped bid rule review and its current status. */
export class CappedBidRuleReview {
  code: string;
  title: string;
  variant: string;
  maximum: number;
  notes: string;
  quantity: number;
  amount: number;
  batchSize: number;
  frequencyCap: number;
  status: CappedBidRuleReviewStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    maximum: number,
    notes: string,
    quantity: number,
    amount: number,
    batchSize: number,
    frequencyCap: number,
    status: CappedBidRuleReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.maximum = maximum;
    this.notes = notes;
    this.quantity = quantity;
    this.amount = amount;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: CappedBidRuleReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
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

  moveTo(next: CappedBidRuleReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped bid rule review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped bid rule review"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.batchSize * this.maximum * 100) / 100;
  }

  copy(): CappedBidRuleReview {
    return new CappedBidRuleReview(
      this.code,
      this.title,
      this.variant,
      this.maximum,
      this.notes,
      this.quantity,
      this.amount,
      this.batchSize,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped bid rule review in status requested. */
export function newCappedBidRuleReview(code: string, title: string): CappedBidRuleReview {
  return new CappedBidRuleReview(code, title, "", 0, "", 0, 0, 0, 0, "requested");
}
