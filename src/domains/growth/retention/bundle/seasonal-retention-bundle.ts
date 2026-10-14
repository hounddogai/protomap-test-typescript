/**
 * The seasonal retention bundle records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal retention bundle is in its life cycle. */
export type SeasonalRetentionBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** One seasonal retention bundle, with what the planners need to act on it. */
export class SeasonalRetentionBundle {
  code: string;
  name: string;
  budget: number;
  weight: number;
  phone: string;
  conversionRate: number;
  endsAt: number;
  maximum: number;
  updatedAt: number;
  summary: string;
  status: SeasonalRetentionBundleStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    weight: number,
    phone: string,
    conversionRate: number,
    endsAt: number,
    maximum: number,
    updatedAt: number,
    summary: string,
    status: SeasonalRetentionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.weight = weight;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.endsAt = endsAt;
    this.maximum = maximum;
    this.updatedAt = updatedAt;
    this.summary = summary;
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

  canMoveTo(next: SeasonalRetentionBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalRetentionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal retention bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round(this.maximum * this.budget * 100) / 100;
  }

  copy(): SeasonalRetentionBundle {
    return new SeasonalRetentionBundle(
      this.code,
      this.name,
      this.budget,
      this.weight,
      this.phone,
      this.conversionRate,
      this.endsAt,
      this.maximum,
      this.updatedAt,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal retention bundle in status requested. */
export function newSeasonalRetentionBundle(code: string, name: string): SeasonalRetentionBundle {
  return new SeasonalRetentionBundle(code, name, 0, 0, "", 0, 0, 0, 0, "", "requested");
}
