import * as text from "../../../../kit/text.js";

/** Where a fallback flight metric is in its life cycle. */
export type FallbackFlightMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback flight metric and its current status. */
export class FallbackFlightMetric {
  code: string;
  label: string;
  impressions: number;
  timezone: string;
  visible: boolean;
  ceiling: number;
  region: string;
  version: number;
  contactEmail: string;
  reviewer: string;
  frequencyCap: number;
  status: FallbackFlightMetricStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    timezone: string,
    visible: boolean,
    ceiling: number,
    region: string,
    version: number,
    contactEmail: string,
    reviewer: string,
    frequencyCap: number,
    status: FallbackFlightMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.timezone = timezone;
    this.visible = visible;
    this.ceiling = ceiling;
    this.region = region;
    this.version = version;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackFlightMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackFlightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback flight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.ceiling + this.impressions) * 100) / 100;
  }

  copy(): FallbackFlightMetric {
    return new FallbackFlightMetric(
      this.code,
      this.label,
      this.impressions,
      this.timezone,
      this.visible,
      this.ceiling,
      this.region,
      this.version,
      this.contactEmail,
      this.reviewer,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a fallback flight metric in status idle. */
export function newFallbackFlightMetric(code: string, label: string): FallbackFlightMetric {
  return new FallbackFlightMetric(code, label, 0, "", false, 0, "", 0, "", "", 0, "idle");
}
