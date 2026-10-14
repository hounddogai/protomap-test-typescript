/**
 * The weighted funnel adjustment records of growth's funnel work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted funnel adjustment is in its life cycle. */
export type WeightedFunnelAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted funnel adjustment. Its code is unique within a tenant. */
export class WeightedFunnelAdjustment {
  code: string;
  label: string;
  score: number;
  locale: string;
  frequencyCap: number;
  attempts: number;
  conversionRate: number;
  ownerId: string;
  status: WeightedFunnelAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    locale: string,
    frequencyCap: number,
    attempts: number,
    conversionRate: number,
    ownerId: string,
    status: WeightedFunnelAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.conversionRate = conversionRate;
    this.ownerId = ownerId;
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

  canMoveTo(next: WeightedFunnelAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedFunnelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted funnel adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted funnel adjustment"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.frequencyCap * this.conversionRate * 100) / 100;
  }

  copy(): WeightedFunnelAdjustment {
    return new WeightedFunnelAdjustment(
      this.code,
      this.label,
      this.score,
      this.locale,
      this.frequencyCap,
      this.attempts,
      this.conversionRate,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted funnel adjustment in status requested. */
export function newWeightedFunnelAdjustment(code: string, label: string): WeightedFunnelAdjustment {
  return new WeightedFunnelAdjustment(code, label, 0, "", 0, 0, 0, "", "requested");
}
