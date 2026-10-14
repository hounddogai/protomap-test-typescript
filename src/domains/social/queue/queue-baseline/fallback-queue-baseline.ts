/**
 * The fallback queue baseline records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback queue baseline is in its life cycle. */
export type FallbackQueueBaselineStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a fallback queue baseline and its current status. */
export class FallbackQueueBaseline {
  code: string;
  label: string;
  cohort: string;
  archived: boolean;
  discount: number;
  campaignRef: string;
  segment: string;
  unit: string;
  impressions: number;
  priority: number;
  amount: number;
  status: FallbackQueueBaselineStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    archived: boolean,
    discount: number,
    campaignRef: string,
    segment: string,
    unit: string,
    impressions: number,
    priority: number,
    amount: number,
    status: FallbackQueueBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.archived = archived;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.unit = unit;
    this.impressions = impressions;
    this.priority = priority;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackQueueBaselineStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackQueueBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback queue baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.priority * this.amount * 100) / 100;
  }

  copy(): FallbackQueueBaseline {
    return new FallbackQueueBaseline(
      this.code,
      this.label,
      this.cohort,
      this.archived,
      this.discount,
      this.campaignRef,
      this.segment,
      this.unit,
      this.impressions,
      this.priority,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback queue baseline in status requested. */
export function newFallbackQueueBaseline(code: string, label: string): FallbackQueueBaseline {
  return new FallbackQueueBaseline(code, label, "", false, 0, "", "", "", 0, 0, 0, "requested");
}
