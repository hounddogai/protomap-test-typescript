import * as text from "../../../../kit/text.js";

/** Where a legacy enrollment review is in its life cycle. */
export type LegacyEnrollmentReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a legacy enrollment review and its current status. */
export class LegacyEnrollmentReview {
  code: string;
  label: string;
  impressions: number;
  currency: string;
  cohort: string;
  status: LegacyEnrollmentReviewStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    currency: string,
    cohort: string,
    status: LegacyEnrollmentReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.currency = currency;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyEnrollmentReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyEnrollmentReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy enrollment review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): LegacyEnrollmentReview {
    return new LegacyEnrollmentReview(this.code, this.label, this.impressions, this.currency, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy enrollment review in status idle. */
export function newLegacyEnrollmentReview(code: string, label: string): LegacyEnrollmentReview {
  return new LegacyEnrollmentReview(code, label, 0, "", "", "idle");
}
