/**
 * The lenient insight schedule records of social's insight work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient insight schedule is in its life cycle. */
export type LenientInsightScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient insight schedule as the insight team keeps it. */
export class LenientInsightSchedule {
  code: string;
  label: string;
  active: boolean;
  retries: number;
  country: string;
  ownerId: string;
  timezone: string;
  margin: number;
  status: LenientInsightScheduleStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    retries: number,
    country: string,
    ownerId: string,
    timezone: string,
    margin: number,
    status: LenientInsightScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.retries = retries;
    this.country = country;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.margin = margin;
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

  canMoveTo(next: LenientInsightScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientInsightScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient insight schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.retries + this.margin) * 100) / 100;
  }

  copy(): LenientInsightSchedule {
    return new LenientInsightSchedule(
      this.code,
      this.label,
      this.active,
      this.retries,
      this.country,
      this.ownerId,
      this.timezone,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a lenient insight schedule in status open. */
export function newLenientInsightSchedule(code: string, label: string): LenientInsightSchedule {
  return new LenientInsightSchedule(code, label, false, 0, "", "", "", 0, "open");
}
