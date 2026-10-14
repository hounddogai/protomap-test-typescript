import * as text from "../../../../kit/text.js";

/** Where a batched suppression review is in its life cycle. */
export type BatchedSuppressionReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a batched suppression review and its current status. */
export class BatchedSuppressionReview {
  code: string;
  name: string;
  currency: string;
  limit: number;
  sendAt: number;
  status: BatchedSuppressionReviewStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    limit: number,
    sendAt: number,
    status: BatchedSuppressionReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.limit = limit;
    this.sendAt = sendAt;
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

  canMoveTo(next: BatchedSuppressionReviewStatus): boolean {
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

  moveTo(next: BatchedSuppressionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched suppression review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.limit * this.sendAt * 100) / 100;
  }

  copy(): BatchedSuppressionReview {
    return new BatchedSuppressionReview(this.code, this.name, this.currency, this.limit, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched suppression review in status proposed. */
export function newBatchedSuppressionReview(code: string, name: string): BatchedSuppressionReview {
  return new BatchedSuppressionReview(code, name, "", 0, 0, "proposed");
}
