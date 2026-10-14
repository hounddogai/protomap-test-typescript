/**
 * The strict frequency review records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict frequency review is in its life cycle. */
export type StrictFrequencyReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict frequency review. Its code is unique within a tenant. */
export class StrictFrequencyReview {
  code: string;
  title: string;
  minimum: number;
  maximum: number;
  createdAt: number;
  reviewer: string;
  status: StrictFrequencyReviewStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    maximum: number,
    createdAt: number,
    reviewer: string,
    status: StrictFrequencyReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.reviewer = reviewer;
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

  canMoveTo(next: StrictFrequencyReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
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

  moveTo(next: StrictFrequencyReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict frequency review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netExposure(): number {
    return Math.round((this.maximum - this.createdAt) * 100) / 100;
  }

  copy(): StrictFrequencyReview {
    return new StrictFrequencyReview(
      this.code,
      this.title,
      this.minimum,
      this.maximum,
      this.createdAt,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict frequency review in status requested. */
export function newStrictFrequencyReview(code: string, title: string): StrictFrequencyReview {
  return new StrictFrequencyReview(code, title, 0, 0, 0, "", "requested");
}
