/**
 * The suppression tier records of consentcenter's suppression work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression tier is in its life cycle. */
export type SuppressionTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression tier. Its code is unique within a tenant. */
export class SuppressionTier {
  code: string;
  name: string;
  maximum: number;
  ratio: number;
  impressions: number;
  variant: string;
  updatedAt: number;
  frequencyCap: number;
  utmSource: string;
  status: SuppressionTierStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    ratio: number,
    impressions: number,
    variant: string,
    updatedAt: number,
    frequencyCap: number,
    utmSource: string,
    status: SuppressionTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.ratio = ratio;
    this.impressions = impressions;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionTierStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"suppression tier"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.maximum + this.ratio) * 100) / 100;
  }

  copy(): SuppressionTier {
    return new SuppressionTier(
      this.code,
      this.name,
      this.maximum,
      this.ratio,
      this.impressions,
      this.variant,
      this.updatedAt,
      this.frequencyCap,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a suppression tier in status planned. */
export function newSuppressionTier(code: string, name: string): SuppressionTier {
  return new SuppressionTier(code, name, 0, 0, 0, "", 0, 0, "", "planned");
}
