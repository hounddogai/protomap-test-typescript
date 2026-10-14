/**
 * The placement review records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement review is in its life cycle. */
export type PlacementReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A placement review as the placement team keeps it. */
export class PlacementReview {
  code: string;
  name: string;
  rate: number;
  country: string;
  durationMinutes: number;
  conversionRate: number;
  contactEmail: string;
  status: PlacementReviewStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    country: string,
    durationMinutes: number,
    conversionRate: number,
    contactEmail: string,
    status: PlacementReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.country = country;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: PlacementReviewStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PlacementReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round((this.rate + this.durationMinutes) * 100) / 100;
  }

  copy(): PlacementReview {
    return new PlacementReview(
      this.code,
      this.name,
      this.rate,
      this.country,
      this.durationMinutes,
      this.conversionRate,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a placement review in status open. */
export function newPlacementReview(code: string, name: string): PlacementReview {
  return new PlacementReview(code, name, 0, "", 0, 0, "", "open");
}
