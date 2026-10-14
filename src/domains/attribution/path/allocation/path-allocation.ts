/**
 * The path allocation records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path allocation is in its life cycle. */
export type PathAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One path allocation, with what the planners need to act on it. */
export class PathAllocation {
  code: string;
  label: string;
  graceDays: number;
  locale: string;
  summary: string;
  rate: number;
  cohort: string;
  maximum: number;
  status: PathAllocationStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    locale: string,
    summary: string,
    rate: number,
    cohort: string,
    maximum: number,
    status: PathAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.locale = locale;
    this.summary = summary;
    this.rate = rate;
    this.cohort = cohort;
    this.maximum = maximum;
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

  canMoveTo(next: PathAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PathAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"path allocation"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.maximum - this.rate) * 100) / 100;
  }

  copy(): PathAllocation {
    return new PathAllocation(
      this.code,
      this.label,
      this.graceDays,
      this.locale,
      this.summary,
      this.rate,
      this.cohort,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a path allocation in status proposed. */
export function newPathAllocation(code: string, label: string): PathAllocation {
  return new PathAllocation(code, label, 0, "", "", 0, "", 0, "proposed");
}
