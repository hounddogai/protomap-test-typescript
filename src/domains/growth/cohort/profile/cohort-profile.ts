/**
 * The cohort profile records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort profile is in its life cycle. */
export type CohortProfileStatus = "created" | "validated" | "published" | "retired";

/** A cohort profile as the cohort team keeps it. */
export class CohortProfile {
  code: string;
  title: string;
  cost: number;
  floorValue: number;
  durationMinutes: number;
  checksum: string;
  timezone: string;
  ceiling: number;
  locale: string;
  archived: boolean;
  minimum: number;
  status: CohortProfileStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    floorValue: number,
    durationMinutes: number,
    checksum: string,
    timezone: string,
    ceiling: number,
    locale: string,
    archived: boolean,
    minimum: number,
    status: CohortProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.checksum = checksum;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.locale = locale;
    this.archived = archived;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortProfileStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"cohort profile"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.ceiling + this.floorValue) * 100) / 100;
  }

  copy(): CohortProfile {
    return new CohortProfile(
      this.code,
      this.title,
      this.cost,
      this.floorValue,
      this.durationMinutes,
      this.checksum,
      this.timezone,
      this.ceiling,
      this.locale,
      this.archived,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a cohort profile in status created. */
export function newCohortProfile(code: string, title: string): CohortProfile {
  return new CohortProfile(code, title, 0, 0, 0, "", "", 0, "", false, 0, "created");
}
