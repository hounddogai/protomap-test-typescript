import * as text from "../../../../kit/text.js";

/** Where a tier review is in its life cycle. */
export type TierReviewStatus = "created" | "validated" | "published" | "retired";

/** A tier review as the tier team keeps it. */
export class TierReview {
  code: string;
  title: string;
  version: number;
  graceDays: number;
  retries: number;
  amount: number;
  locale: string;
  maximum: number;
  status: TierReviewStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    graceDays: number,
    retries: number,
    amount: number,
    locale: string,
    maximum: number,
    status: TierReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.graceDays = graceDays;
    this.retries = retries;
    this.amount = amount;
    this.locale = locale;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TierReviewStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TierReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"tier review"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.maximum + this.graceDays) * 100) / 100;
  }

  copy(): TierReview {
    return new TierReview(
      this.code,
      this.title,
      this.version,
      this.graceDays,
      this.retries,
      this.amount,
      this.locale,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier review in status created. */
export function newTierReview(code: string, title: string): TierReview {
  return new TierReview(code, title, 0, 0, 0, 0, "", 0, "created");
}
