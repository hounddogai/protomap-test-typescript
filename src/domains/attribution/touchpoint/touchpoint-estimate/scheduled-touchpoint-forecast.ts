import * as text from "../../../../kit/text.js";

/** Where a scheduled touchpoint forecast is in its life cycle. */
export type ScheduledTouchpointForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled touchpoint forecast, with what the planners need to act on it. */
export class ScheduledTouchpointForecast {
  code: string;
  label: string;
  cost: number;
  locale: string;
  floorValue: number;
  durationMinutes: number;
  country: string;
  cohort: string;
  graceDays: number;
  weight: number;
  status: ScheduledTouchpointForecastStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    locale: string,
    floorValue: number,
    durationMinutes: number,
    country: string,
    cohort: string,
    graceDays: number,
    weight: number,
    status: ScheduledTouchpointForecastStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.locale = locale;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.country = country;
    this.cohort = cohort;
    this.graceDays = graceDays;
    this.weight = weight;
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

  canMoveTo(next: ScheduledTouchpointForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledTouchpointForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled touchpoint forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round((this.cost - this.weight) * 100) / 100;
  }

  copy(): ScheduledTouchpointForecast {
    return new ScheduledTouchpointForecast(
      this.code,
      this.label,
      this.cost,
      this.locale,
      this.floorValue,
      this.durationMinutes,
      this.country,
      this.cohort,
      this.graceDays,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled touchpoint forecast in status open. */
export function newScheduledTouchpointForecast(code: string, label: string): ScheduledTouchpointForecast {
  return new ScheduledTouchpointForecast(code, label, 0, "", 0, 0, "", "", 0, 0, "open");
}
