/**
 * The primary bounce review records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary bounce review is in its life cycle. */
export type PrimaryBounceReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary bounce review as the bounce team keeps it. */
export class PrimaryBounceReview {
  code: string;
  title: string;
  attributes: Map<string, string>;
  cohort: string;
  journeyId: string;
  category: string;
  ceiling: number;
  durationMinutes: number;
  approved: boolean;
  status: PrimaryBounceReviewStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    cohort: string,
    journeyId: string,
    category: string,
    ceiling: number,
    durationMinutes: number,
    approved: boolean,
    status: PrimaryBounceReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.category = category;
    this.ceiling = ceiling;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
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

  canMoveTo(next: PrimaryBounceReviewStatus): boolean {
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryBounceReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary bounce review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary bounce review"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.durationMinutes - this.ceiling) * 100) / 100;
  }

  copy(): PrimaryBounceReview {
    return new PrimaryBounceReview(
      this.code,
      this.title,
      this.attributes,
      this.cohort,
      this.journeyId,
      this.category,
      this.ceiling,
      this.durationMinutes,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary bounce review in status proposed. */
export function newPrimaryBounceReview(code: string, title: string): PrimaryBounceReview {
  return new PrimaryBounceReview(code, title, new Map<string, string>(), "", "", "", 0, 0, false, "proposed");
}
