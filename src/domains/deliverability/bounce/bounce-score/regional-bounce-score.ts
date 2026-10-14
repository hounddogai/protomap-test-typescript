/**
 * The regional bounce score records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional bounce score is in its life cycle. */
export type RegionalBounceScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a regional bounce score and its current status. */
export class RegionalBounceScore {
  code: string;
  title: string;
  locale: string;
  threshold: number;
  unit: string;
  status: RegionalBounceScoreStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    threshold: number,
    unit: string,
    status: RegionalBounceScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.threshold = threshold;
    this.unit = unit;
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

  canMoveTo(next: RegionalBounceScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalBounceScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional bounce score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): RegionalBounceScore {
    return new RegionalBounceScore(this.code, this.title, this.locale, this.threshold, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional bounce score in status proposed. */
export function newRegionalBounceScore(code: string, title: string): RegionalBounceScore {
  return new RegionalBounceScore(code, title, "", 0, "", "proposed");
}
