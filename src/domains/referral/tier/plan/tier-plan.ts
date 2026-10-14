/**
 * The tier plan records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier plan is in its life cycle. */
export type TierPlanStatus = "created" | "validated" | "published" | "retired";

/** A tier plan as the tier team keeps it. */
export class TierPlan {
  code: string;
  label: string;
  ratio: number;
  clicks: number;
  country: string;
  status: TierPlanStatus;

  constructor(code: string, label: string, ratio: number, clicks: number, country: string, status: TierPlanStatus) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.clicks = clicks;
    this.country = country;
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

  canMoveTo(next: TierPlanStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TierPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.clicks * this.ratio * 100) / 100;
  }

  copy(): TierPlan {
    return new TierPlan(this.code, this.label, this.ratio, this.clicks, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tier plan in status created. */
export function newTierPlan(code: string, label: string): TierPlan {
  return new TierPlan(code, label, 0, 0, "", "created");
}
