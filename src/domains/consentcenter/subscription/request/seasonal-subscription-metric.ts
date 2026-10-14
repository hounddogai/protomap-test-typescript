import * as text from "../../../../kit/text.js";

/** Where a seasonal subscription metric is in its life cycle. */
export type SeasonalSubscriptionMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal subscription metric. Its code is unique within a tenant. */
export class SeasonalSubscriptionMetric {
  code: string;
  name: string;
  budget: number;
  timezone: string;
  locale: string;
  cohort: string;
  floorValue: number;
  status: SeasonalSubscriptionMetricStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    timezone: string,
    locale: string,
    cohort: string,
    floorValue: number,
    status: SeasonalSubscriptionMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.timezone = timezone;
    this.locale = locale;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalSubscriptionMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSubscriptionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal subscription metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal subscription metric"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.floorValue + this.budget) * 100) / 100;
  }

  copy(): SeasonalSubscriptionMetric {
    return new SeasonalSubscriptionMetric(
      this.code,
      this.name,
      this.budget,
      this.timezone,
      this.locale,
      this.cohort,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal subscription metric in status proposed. */
export function newSeasonalSubscriptionMetric(code: string, name: string): SeasonalSubscriptionMetric {
  return new SeasonalSubscriptionMetric(code, name, 0, "", "", "", 0, "proposed");
}
