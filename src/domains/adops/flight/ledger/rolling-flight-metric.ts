import * as text from "../../../../kit/text.js";

/** Where a rolling flight metric is in its life cycle. */
export type RollingFlightMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling flight metric as the flight team keeps it. */
export class RollingFlightMetric {
  code: string;
  label: string;
  maximum: number;
  timezone: string;
  margin: number;
  frequencyCap: number;
  utmSource: string;
  segment: string;
  clicks: number;
  status: RollingFlightMetricStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    timezone: string,
    margin: number,
    frequencyCap: number,
    utmSource: string,
    segment: string,
    clicks: number,
    status: RollingFlightMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.timezone = timezone;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.segment = segment;
    this.clicks = clicks;
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

  canMoveTo(next: RollingFlightMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingFlightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling flight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.frequencyCap - this.clicks) * 100) / 100;
  }

  copy(): RollingFlightMetric {
    return new RollingFlightMetric(
      this.code,
      this.label,
      this.maximum,
      this.timezone,
      this.margin,
      this.frequencyCap,
      this.utmSource,
      this.segment,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling flight metric in status draft. */
export function newRollingFlightMetric(code: string, label: string): RollingFlightMetric {
  return new RollingFlightMetric(code, label, 0, "", 0, 0, "", "", 0, "draft");
}
