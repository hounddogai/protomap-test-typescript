/**
 * The legacy queue estimate records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy queue estimate is in its life cycle. */
export type LegacyQueueEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a legacy queue estimate and its current status. */
export class LegacyQueueEstimate {
  code: string;
  label: string;
  openRate: number;
  clicks: number;
  rate: number;
  discount: number;
  ownerId: string;
  impressions: number;
  endsAt: number;
  margin: number;
  status: LegacyQueueEstimateStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    clicks: number,
    rate: number,
    discount: number,
    ownerId: string,
    impressions: number,
    endsAt: number,
    margin: number,
    status: LegacyQueueEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.clicks = clicks;
    this.rate = rate;
    this.discount = discount;
    this.ownerId = ownerId;
    this.impressions = impressions;
    this.endsAt = endsAt;
    this.margin = margin;
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

  canMoveTo(next: LegacyQueueEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyQueueEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy queue estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy queue estimate"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.endsAt - this.impressions) * 100) / 100;
  }

  copy(): LegacyQueueEstimate {
    return new LegacyQueueEstimate(
      this.code,
      this.label,
      this.openRate,
      this.clicks,
      this.rate,
      this.discount,
      this.ownerId,
      this.impressions,
      this.endsAt,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy queue estimate in status open. */
export function newLegacyQueueEstimate(code: string, label: string): LegacyQueueEstimate {
  return new LegacyQueueEstimate(code, label, 0, 0, 0, 0, "", 0, 0, 0, "open");
}
