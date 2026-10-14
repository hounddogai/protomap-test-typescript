import * as text from "../../../../kit/text.js";

/** Where a tiered credit tier is in its life cycle. */
export type TieredCreditTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered credit tier as the credit team keeps it. */
export class TieredCreditTier {
  code: string;
  name: string;
  currency: string;
  threshold: number;
  margin: number;
  timezone: string;
  impressions: number;
  approved: boolean;
  score: number;
  status: TieredCreditTierStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    threshold: number,
    margin: number,
    timezone: string,
    impressions: number,
    approved: boolean,
    score: number,
    status: TieredCreditTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.threshold = threshold;
    this.margin = margin;
    this.timezone = timezone;
    this.impressions = impressions;
    this.approved = approved;
    this.score = score;
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

  canMoveTo(next: TieredCreditTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredCreditTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered credit tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.score - this.impressions) * 100) / 100;
  }

  copy(): TieredCreditTier {
    return new TieredCreditTier(
      this.code,
      this.name,
      this.currency,
      this.threshold,
      this.margin,
      this.timezone,
      this.impressions,
      this.approved,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered credit tier in status new. */
export function newTieredCreditTier(code: string, name: string): TieredCreditTier {
  return new TieredCreditTier(code, name, "", 0, 0, "", 0, false, 0, "new");
}
