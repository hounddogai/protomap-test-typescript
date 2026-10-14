import * as text from "../../../../kit/text.js";

/** Where a seasonal exit rule metric is in its life cycle. */
export type SeasonalExitRuleMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal exit rule metric as the exit rule team keeps it. */
export class SeasonalExitRuleMetric {
  code: string;
  label: string;
  revision: number;
  batchSize: number;
  cohort: string;
  endsAt: number;
  country: string;
  phone: string;
  status: SeasonalExitRuleMetricStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    batchSize: number,
    cohort: string,
    endsAt: number,
    country: string,
    phone: string,
    status: SeasonalExitRuleMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.batchSize = batchSize;
    this.cohort = cohort;
    this.endsAt = endsAt;
    this.country = country;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalExitRuleMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalExitRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal exit rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.revision + this.endsAt) * 100) / 100;
  }

  copy(): SeasonalExitRuleMetric {
    return new SeasonalExitRuleMetric(
      this.code,
      this.label,
      this.revision,
      this.batchSize,
      this.cohort,
      this.endsAt,
      this.country,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal exit rule metric in status draft. */
export function newSeasonalExitRuleMetric(code: string, label: string): SeasonalExitRuleMetric {
  return new SeasonalExitRuleMetric(code, label, 0, 0, "", 0, "", "", "draft");
}
