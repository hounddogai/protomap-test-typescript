/**
 * The legacy preference review records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy preference review is in its life cycle. */
export type LegacyPreferenceReviewStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy preference review and its current status. */
export class LegacyPreferenceReview {
  code: string;
  name: string;
  timezone: string;
  phone: string;
  ceiling: number;
  floorValue: number;
  category: string;
  status: LegacyPreferenceReviewStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    phone: string,
    ceiling: number,
    floorValue: number,
    category: string,
    status: LegacyPreferenceReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.phone = phone;
    this.ceiling = ceiling;
    this.floorValue = floorValue;
    this.category = category;
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

  canMoveTo(next: LegacyPreferenceReviewStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyPreferenceReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy preference review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy preference review"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.ceiling + this.floorValue) * 100) / 100;
  }

  copy(): LegacyPreferenceReview {
    return new LegacyPreferenceReview(
      this.code,
      this.name,
      this.timezone,
      this.phone,
      this.ceiling,
      this.floorValue,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy preference review in status created. */
export function newLegacyPreferenceReview(code: string, name: string): LegacyPreferenceReview {
  return new LegacyPreferenceReview(code, name, "", "", 0, 0, "", "created");
}
