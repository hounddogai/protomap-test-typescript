import * as text from "../../../../kit/text.js";

/** Where a fallback cohort forecast is in its life cycle. */
export type FallbackCohortForecastStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback cohort forecast and its current status. */
export class FallbackCohortForecast {
  code: string;
  name: string;
  conversionRate: number;
  visible: boolean;
  variant: string;
  priority: number;
  reviewer: string;
  label: string;
  description: string;
  status: FallbackCohortForecastStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    visible: boolean,
    variant: string,
    priority: number,
    reviewer: string,
    label: string,
    description: string,
    status: FallbackCohortForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.visible = visible;
    this.variant = variant;
    this.priority = priority;
    this.reviewer = reviewer;
    this.label = label;
    this.description = description;
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

  canMoveTo(next: FallbackCohortForecastStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackCohortForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback cohort forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback cohort forecast"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.priority - this.conversionRate) * 100) / 100;
  }

  copy(): FallbackCohortForecast {
    return new FallbackCohortForecast(
      this.code,
      this.name,
      this.conversionRate,
      this.visible,
      this.variant,
      this.priority,
      this.reviewer,
      this.label,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback cohort forecast in status idle. */
export function newFallbackCohortForecast(code: string, name: string): FallbackCohortForecast {
  return new FallbackCohortForecast(code, name, 0, false, "", 0, "", "", "", "idle");
}
