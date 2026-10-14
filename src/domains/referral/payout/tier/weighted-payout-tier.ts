/**
 * The weighted payout tier records of referral's payout work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted payout tier is in its life cycle. */
export type WeightedPayoutTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted payout tier as the payout team keeps it. */
export class WeightedPayoutTier {
  code: string;
  label: string;
  margin: number;
  endsAt: number;
  externalRef: string;
  threshold: number;
  expiresAt: number;
  title: string;
  category: string;
  rate: number;
  status: WeightedPayoutTierStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    endsAt: number,
    externalRef: string,
    threshold: number,
    expiresAt: number,
    title: string,
    category: string,
    rate: number,
    status: WeightedPayoutTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.expiresAt = expiresAt;
    this.title = title;
    this.category = category;
    this.rate = rate;
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

  canMoveTo(next: WeightedPayoutTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: WeightedPayoutTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted payout tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.rate * this.threshold * 100) / 100;
  }

  copy(): WeightedPayoutTier {
    return new WeightedPayoutTier(
      this.code,
      this.label,
      this.margin,
      this.endsAt,
      this.externalRef,
      this.threshold,
      this.expiresAt,
      this.title,
      this.category,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted payout tier in status new. */
export function newWeightedPayoutTier(code: string, label: string): WeightedPayoutTier {
  return new WeightedPayoutTier(code, label, 0, 0, "", 0, 0, "", "", 0, "new");
}
