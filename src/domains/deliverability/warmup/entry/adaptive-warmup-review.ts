import * as text from "../../../../kit/text.js";

/** Where a adaptive warmup review is in its life cycle. */
export type AdaptiveWarmupReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive warmup review. Its code is unique within a tenant. */
export class AdaptiveWarmupReview {
  code: string;
  name: string;
  category: string;
  currency: string;
  reviewer: string;
  amount: number;
  status: AdaptiveWarmupReviewStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    currency: string,
    reviewer: string,
    amount: number,
    status: AdaptiveWarmupReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.currency = currency;
    this.reviewer = reviewer;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveWarmupReviewStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveWarmupReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive warmup review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive warmup review"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): AdaptiveWarmupReview {
    return new AdaptiveWarmupReview(
      this.code,
      this.name,
      this.category,
      this.currency,
      this.reviewer,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a adaptive warmup review in status open. */
export function newAdaptiveWarmupReview(code: string, name: string): AdaptiveWarmupReview {
  return new AdaptiveWarmupReview(code, name, "", "", "", 0, "open");
}
