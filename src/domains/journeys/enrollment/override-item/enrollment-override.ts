/**
 * The enrollment override records of journeys's enrollment work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment override is in its life cycle. */
export type EnrollmentOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a enrollment override and its current status. */
export class EnrollmentOverride {
  code: string;
  title: string;
  country: string;
  ratio: number;
  durationMinutes: number;
  frequencyCap: number;
  cost: number;
  externalRef: string;
  region: string;
  status: EnrollmentOverrideStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    ratio: number,
    durationMinutes: number,
    frequencyCap: number,
    cost: number,
    externalRef: string,
    region: string,
    status: EnrollmentOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.externalRef = externalRef;
    this.region = region;
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

  canMoveTo(next: EnrollmentOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: EnrollmentOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"enrollment override"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.frequencyCap + this.durationMinutes) * 100) / 100;
  }

  copy(): EnrollmentOverride {
    return new EnrollmentOverride(
      this.code,
      this.title,
      this.country,
      this.ratio,
      this.durationMinutes,
      this.frequencyCap,
      this.cost,
      this.externalRef,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a enrollment override in status proposed. */
export function newEnrollmentOverride(code: string, title: string): EnrollmentOverride {
  return new EnrollmentOverride(code, title, "", 0, 0, 0, 0, "", "", "proposed");
}
