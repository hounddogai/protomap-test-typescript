/**
 * The capped journey review records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped journey review is in its life cycle. */
export type CappedJourneyReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped journey review, with what the planners need to act on it. */
export class CappedJourneyReview {
  code: string;
  title: string;
  cost: number;
  clicks: number;
  margin: number;
  durationMinutes: number;
  openRate: number;
  unit: string;
  status: CappedJourneyReviewStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    clicks: number,
    margin: number,
    durationMinutes: number,
    openRate: number,
    unit: string,
    status: CappedJourneyReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.clicks = clicks;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.openRate = openRate;
    this.unit = unit;
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

  canMoveTo(next: CappedJourneyReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedJourneyReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped journey review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedValue(): number {
    return Math.round((this.margin + this.durationMinutes) * 100) / 100;
  }

  copy(): CappedJourneyReview {
    return new CappedJourneyReview(
      this.code,
      this.title,
      this.cost,
      this.clicks,
      this.margin,
      this.durationMinutes,
      this.openRate,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped journey review in status proposed. */
export function newCappedJourneyReview(code: string, title: string): CappedJourneyReview {
  return new CappedJourneyReview(code, title, 0, 0, 0, 0, 0, "", "proposed");
}
