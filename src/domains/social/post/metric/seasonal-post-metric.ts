/**
 * The seasonal post metric records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal post metric is in its life cycle. */
export type SeasonalPostMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal post metric as the post team keeps it. */
export class SeasonalPostMetric {
  code: string;
  label: string;
  minimum: number;
  locale: string;
  discount: number;
  cohort: string;
  category: string;
  openRate: number;
  weight: number;
  status: SeasonalPostMetricStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    locale: string,
    discount: number,
    cohort: string,
    category: string,
    openRate: number,
    weight: number,
    status: SeasonalPostMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.locale = locale;
    this.discount = discount;
    this.cohort = cohort;
    this.category = category;
    this.openRate = openRate;
    this.weight = weight;
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

  canMoveTo(next: SeasonalPostMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPostMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal post metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal post metric"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.minimum + this.openRate) * 100) / 100;
  }

  copy(): SeasonalPostMetric {
    return new SeasonalPostMetric(
      this.code,
      this.label,
      this.minimum,
      this.locale,
      this.discount,
      this.cohort,
      this.category,
      this.openRate,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal post metric in status requested. */
export function newSeasonalPostMetric(code: string, label: string): SeasonalPostMetric {
  return new SeasonalPostMetric(code, label, 0, "", 0, "", "", 0, 0, "requested");
}
