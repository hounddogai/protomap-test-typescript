/**
 * The csat schedule records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat schedule is in its life cycle. */
export type CsatScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One csat schedule, with what the planners need to act on it. */
export class CsatSchedule {
  code: string;
  label: string;
  name: string;
  minimum: number;
  country: string;
  openRate: number;
  impressions: number;
  status: CsatScheduleStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    minimum: number,
    country: string,
    openRate: number,
    impressions: number,
    status: CsatScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.minimum = minimum;
    this.country = country;
    this.openRate = openRate;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.impressions + this.openRate) * 100) / 100;
  }

  copy(): CsatSchedule {
    return new CsatSchedule(
      this.code,
      this.label,
      this.name,
      this.minimum,
      this.country,
      this.openRate,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a csat schedule in status draft. */
export function newCsatSchedule(code: string, label: string): CsatSchedule {
  return new CsatSchedule(code, label, "", 0, "", 0, 0, "draft");
}
