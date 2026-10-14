/**
 * The seasonal subscription tier records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal subscription tier is in its life cycle. */
export type SeasonalSubscriptionTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal subscription tier. Its code is unique within a tenant. */
export class SeasonalSubscriptionTier {
  code: string;
  title: string;
  region: string;
  updatedAt: number;
  limit: number;
  priority: number;
  budget: number;
  status: SeasonalSubscriptionTierStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    updatedAt: number,
    limit: number,
    priority: number,
    budget: number,
    status: SeasonalSubscriptionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.priority = priority;
    this.budget = budget;
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

  canMoveTo(next: SeasonalSubscriptionTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSubscriptionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal subscription tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round(this.limit * this.priority * 100) / 100;
  }

  copy(): SeasonalSubscriptionTier {
    return new SeasonalSubscriptionTier(
      this.code,
      this.title,
      this.region,
      this.updatedAt,
      this.limit,
      this.priority,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal subscription tier in status open. */
export function newSeasonalSubscriptionTier(code: string, title: string): SeasonalSubscriptionTier {
  return new SeasonalSubscriptionTier(code, title, "", 0, 0, 0, 0, "open");
}
