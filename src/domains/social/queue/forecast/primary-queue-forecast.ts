/**
 * The primary queue forecast records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary queue forecast is in its life cycle. */
export type PrimaryQueueForecastStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One primary queue forecast, with what the planners need to act on it. */
export class PrimaryQueueForecast {
  code: string;
  title: string;
  discount: number;
  locale: string;
  startsAt: number;
  cohort: string;
  country: string;
  sequence: number;
  status: PrimaryQueueForecastStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    locale: string,
    startsAt: number,
    cohort: string,
    country: string,
    sequence: number,
    status: PrimaryQueueForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.locale = locale;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.country = country;
    this.sequence = sequence;
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

  canMoveTo(next: PrimaryQueueForecastStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryQueueForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary queue forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.discount - this.startsAt) * 100) / 100;
  }

  copy(): PrimaryQueueForecast {
    return new PrimaryQueueForecast(
      this.code,
      this.title,
      this.discount,
      this.locale,
      this.startsAt,
      this.cohort,
      this.country,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary queue forecast in status open. */
export function newPrimaryQueueForecast(code: string, title: string): PrimaryQueueForecast {
  return new PrimaryQueueForecast(code, title, 0, "", 0, "", "", 0, "open");
}
