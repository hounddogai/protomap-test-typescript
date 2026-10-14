/**
 * The scheduled enrollment forecast records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled enrollment forecast is in its life cycle. */
export type ScheduledEnrollmentForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One scheduled enrollment forecast, with what the planners need to act on it. */
export class ScheduledEnrollmentForecast {
  code: string;
  label: string;
  ceiling: number;
  budget: number;
  externalRef: string;
  variant: string;
  region: string;
  summary: string;
  status: ScheduledEnrollmentForecastStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    budget: number,
    externalRef: string,
    variant: string,
    region: string,
    summary: string,
    status: ScheduledEnrollmentForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.budget = budget;
    this.externalRef = externalRef;
    this.variant = variant;
    this.region = region;
    this.summary = summary;
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

  canMoveTo(next: ScheduledEnrollmentForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledEnrollmentForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled enrollment forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled enrollment forecast"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.ceiling * this.budget * 100) / 100;
  }

  copy(): ScheduledEnrollmentForecast {
    return new ScheduledEnrollmentForecast(
      this.code,
      this.label,
      this.ceiling,
      this.budget,
      this.externalRef,
      this.variant,
      this.region,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled enrollment forecast in status planned. */
export function newScheduledEnrollmentForecast(code: string, label: string): ScheduledEnrollmentForecast {
  return new ScheduledEnrollmentForecast(code, label, 0, 0, "", "", "", "", "planned");
}
