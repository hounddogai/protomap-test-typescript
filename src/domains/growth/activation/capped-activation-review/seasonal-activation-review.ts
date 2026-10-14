/**
 * The seasonal activation review records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal activation review is in its life cycle. */
export type SeasonalActivationReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal activation review as the activation team keeps it. */
export class SeasonalActivationReview {
  code: string;
  name: string;
  quantity: number;
  maximum: number;
  utmSource: string;
  pinned: boolean;
  approved: boolean;
  budget: number;
  variant: string;
  status: SeasonalActivationReviewStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    maximum: number,
    utmSource: string,
    pinned: boolean,
    approved: boolean,
    budget: number,
    variant: string,
    status: SeasonalActivationReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.maximum = maximum;
    this.utmSource = utmSource;
    this.pinned = pinned;
    this.approved = approved;
    this.budget = budget;
    this.variant = variant;
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

  canMoveTo(next: SeasonalActivationReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalActivationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal activation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal activation review"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.budget + this.maximum) * 100) / 100;
  }

  copy(): SeasonalActivationReview {
    return new SeasonalActivationReview(
      this.code,
      this.name,
      this.quantity,
      this.maximum,
      this.utmSource,
      this.pinned,
      this.approved,
      this.budget,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal activation review in status idle. */
export function newSeasonalActivationReview(code: string, name: string): SeasonalActivationReview {
  return new SeasonalActivationReview(code, name, 0, 0, "", false, false, 0, "", "idle");
}
