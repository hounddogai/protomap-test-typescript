/**
 * The legacy post review records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy post review is in its life cycle. */
export type LegacyPostReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a legacy post review and its current status. */
export class LegacyPostReview {
  code: string;
  title: string;
  openRate: number;
  cost: number;
  discount: number;
  rate: number;
  pinned: boolean;
  status: LegacyPostReviewStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    cost: number,
    discount: number,
    rate: number,
    pinned: boolean,
    status: LegacyPostReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.cost = cost;
    this.discount = discount;
    this.rate = rate;
    this.pinned = pinned;
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

  canMoveTo(next: LegacyPostReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPostReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy post review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy post review"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate - this.discount) * 100) / 100;
  }

  copy(): LegacyPostReview {
    return new LegacyPostReview(
      this.code,
      this.title,
      this.openRate,
      this.cost,
      this.discount,
      this.rate,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy post review in status new. */
export function newLegacyPostReview(code: string, title: string): LegacyPostReview {
  return new LegacyPostReview(code, title, 0, 0, 0, 0, false, "new");
}
