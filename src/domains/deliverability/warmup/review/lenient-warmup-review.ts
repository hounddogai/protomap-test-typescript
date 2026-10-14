import * as text from "../../../../kit/text.js";

/** Where a lenient warmup review is in its life cycle. */
export type LenientWarmupReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient warmup review and its current status. */
export class LenientWarmupReview {
  code: string;
  label: string;
  locale: string;
  currency: string;
  approved: boolean;
  notes: string;
  campaignRef: string;
  ownerId: string;
  unit: string;
  amount: number;
  status: LenientWarmupReviewStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    currency: string,
    approved: boolean,
    notes: string,
    campaignRef: string,
    ownerId: string,
    unit: string,
    amount: number,
    status: LenientWarmupReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.currency = currency;
    this.approved = approved;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.unit = unit;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientWarmupReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientWarmupReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): LenientWarmupReview {
    return new LenientWarmupReview(
      this.code,
      this.label,
      this.locale,
      this.currency,
      this.approved,
      this.notes,
      this.campaignRef,
      this.ownerId,
      this.unit,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient warmup review in status new. */
export function newLenientWarmupReview(code: string, label: string): LenientWarmupReview {
  return new LenientWarmupReview(code, label, "", "", false, "", "", "", "", 0, "new");
}
