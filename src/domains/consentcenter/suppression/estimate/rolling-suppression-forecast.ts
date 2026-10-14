import * as text from "../../../../kit/text.js";

/** Where a rolling suppression forecast is in its life cycle. */
export type RollingSuppressionForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling suppression forecast as the suppression team keeps it. */
export class RollingSuppressionForecast {
  code: string;
  label: string;
  unit: string;
  frequencyCap: number;
  updatedAt: number;
  country: string;
  segment: string;
  conversionRate: number;
  status: RollingSuppressionForecastStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    frequencyCap: number,
    updatedAt: number,
    country: string,
    segment: string,
    conversionRate: number,
    status: RollingSuppressionForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.country = country;
    this.segment = segment;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RollingSuppressionForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingSuppressionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling suppression forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.conversionRate - this.updatedAt) * 100) / 100;
  }

  copy(): RollingSuppressionForecast {
    return new RollingSuppressionForecast(
      this.code,
      this.label,
      this.unit,
      this.frequencyCap,
      this.updatedAt,
      this.country,
      this.segment,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling suppression forecast in status proposed. */
export function newRollingSuppressionForecast(code: string, label: string): RollingSuppressionForecast {
  return new RollingSuppressionForecast(code, label, "", 0, 0, "", "", 0, "proposed");
}
