/**
 * The cohort baseline records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort baseline is in its life cycle. */
export type CohortBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A cohort baseline. Its code is unique within a tenant. */
export class CohortBaseline {
  code: string;
  title: string;
  region: string;
  locale: string;
  floorValue: number;
  tags: string[];
  status: CohortBaselineStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    locale: string,
    floorValue: number,
    tags: string[],
    status: CohortBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.locale = locale;
    this.floorValue = floorValue;
    this.tags = tags;
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

  canMoveTo(next: CohortBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CohortBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): CohortBaseline {
    return new CohortBaseline(this.code, this.title, this.region, this.locale, this.floorValue, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a cohort baseline in status open. */
export function newCohortBaseline(code: string, title: string): CohortBaseline {
  return new CohortBaseline(code, title, "", "", 0, [], "open");
}
