/**
 * The cohort reservation records of growth's cohort work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort reservation is in its life cycle. */
export type CohortReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One cohort reservation, with what the planners need to act on it. */
export class CohortReservation {
  code: string;
  name: string;
  ratio: number;
  locale: string;
  retries: number;
  status: CohortReservationStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    locale: string,
    retries: number,
    status: CohortReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.locale = locale;
    this.retries = retries;
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

  canMoveTo(next: CohortReservationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "archived";
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

  moveTo(next: CohortReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"cohort reservation"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.retries + this.ratio) * 100) / 100;
  }

  copy(): CohortReservation {
    return new CohortReservation(this.code, this.name, this.ratio, this.locale, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a cohort reservation in status open. */
export function newCohortReservation(code: string, name: string): CohortReservation {
  return new CohortReservation(code, name, 0, "", 0, "open");
}
