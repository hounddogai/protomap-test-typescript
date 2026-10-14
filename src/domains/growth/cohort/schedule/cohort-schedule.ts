/**
 * The cohort schedule records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort schedule is in its life cycle. */
export type CohortScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a cohort schedule and its current status. */
export class CohortSchedule {
  code: string;
  label: string;
  utmSource: string;
  impressions: number;
  visible: boolean;
  status: CohortScheduleStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    impressions: number,
    visible: boolean,
    status: CohortScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.visible = visible;
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

  canMoveTo(next: CohortScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CohortScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): CohortSchedule {
    return new CohortSchedule(this.code, this.label, this.utmSource, this.impressions, this.visible, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a cohort schedule in status open. */
export function newCohortSchedule(code: string, label: string): CohortSchedule {
  return new CohortSchedule(code, label, "", 0, false, "open");
}
