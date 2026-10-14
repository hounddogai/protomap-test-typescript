import * as text from "../../../../kit/text.js";

/** Where a adaptive suppression forecast is in its life cycle. */
export type AdaptiveSuppressionForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive suppression forecast as the suppression team keeps it. */
export class AdaptiveSuppressionForecast {
  code: string;
  title: string;
  durationMinutes: number;
  priority: number;
  capacity: number;
  batchSize: number;
  frequencyCap: number;
  region: string;
  version: number;
  status: AdaptiveSuppressionForecastStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    priority: number,
    capacity: number,
    batchSize: number,
    frequencyCap: number,
    region: string,
    version: number,
    status: AdaptiveSuppressionForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.region = region;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveSuppressionForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSuppressionForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive suppression forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"adaptive suppression forecast"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.priority - this.frequencyCap) * 100) / 100;
  }

  copy(): AdaptiveSuppressionForecast {
    return new AdaptiveSuppressionForecast(
      this.code,
      this.title,
      this.durationMinutes,
      this.priority,
      this.capacity,
      this.batchSize,
      this.frequencyCap,
      this.region,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive suppression forecast in status open. */
export function newAdaptiveSuppressionForecast(code: string, title: string): AdaptiveSuppressionForecast {
  return new AdaptiveSuppressionForecast(code, title, 0, 0, 0, 0, 0, "", 0, "open");
}
