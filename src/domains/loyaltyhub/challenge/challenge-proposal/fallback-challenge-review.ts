import * as text from "../../../../kit/text.js";

/** Where a fallback challenge review is in its life cycle. */
export type FallbackChallengeReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback challenge review. Its code is unique within a tenant. */
export class FallbackChallengeReview {
  code: string;
  label: string;
  category: string;
  minimum: number;
  startsAt: number;
  segment: string;
  contactEmail: string;
  threshold: number;
  currency: string;
  externalRef: string;
  status: FallbackChallengeReviewStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    minimum: number,
    startsAt: number,
    segment: string,
    contactEmail: string,
    threshold: number,
    currency: string,
    externalRef: string,
    status: FallbackChallengeReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.segment = segment;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.currency = currency;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackChallengeReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackChallengeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback challenge review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.threshold + this.minimum) * 100) / 100;
  }

  copy(): FallbackChallengeReview {
    return new FallbackChallengeReview(
      this.code,
      this.label,
      this.category,
      this.minimum,
      this.startsAt,
      this.segment,
      this.contactEmail,
      this.threshold,
      this.currency,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback challenge review in status draft. */
export function newFallbackChallengeReview(code: string, label: string): FallbackChallengeReview {
  return new FallbackChallengeReview(code, label, "", 0, 0, "", "", 0, "", "", "draft");
}
