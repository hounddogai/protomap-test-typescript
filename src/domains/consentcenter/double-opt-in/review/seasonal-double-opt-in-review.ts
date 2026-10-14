/**
 * The seasonal double opt in review records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal double opt in review is in its life cycle. */
export type SeasonalDoubleOptInReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal double opt in review and its current status. */
export class SeasonalDoubleOptInReview {
  code: string;
  label: string;
  locale: string;
  country: string;
  discount: number;
  channel: string;
  variant: string;
  notes: string;
  status: SeasonalDoubleOptInReviewStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    country: string,
    discount: number,
    channel: string,
    variant: string,
    notes: string,
    status: SeasonalDoubleOptInReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.country = country;
    this.discount = discount;
    this.channel = channel;
    this.variant = variant;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalDoubleOptInReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDoubleOptInReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal double opt in review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): SeasonalDoubleOptInReview {
    return new SeasonalDoubleOptInReview(
      this.code,
      this.label,
      this.locale,
      this.country,
      this.discount,
      this.channel,
      this.variant,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal double opt in review in status planned. */
export function newSeasonalDoubleOptInReview(code: string, label: string): SeasonalDoubleOptInReview {
  return new SeasonalDoubleOptInReview(code, label, "", "", 0, "", "", "", "planned");
}
