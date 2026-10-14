/**
 * The scheduled level profile records of loyaltyhub's level work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled level profile is in its life cycle. */
export type ScheduledLevelProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A scheduled level profile as the level team keeps it. */
export class ScheduledLevelProfile {
  code: string;
  label: string;
  priority: number;
  cohort: string;
  region: string;
  batchSize: number;
  category: string;
  status: ScheduledLevelProfileStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    cohort: string,
    region: string,
    batchSize: number,
    category: string,
    status: ScheduledLevelProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.cohort = cohort;
    this.region = region;
    this.batchSize = batchSize;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledLevelProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledLevelProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled level profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled level profile"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.batchSize - this.priority) * 100) / 100;
  }

  copy(): ScheduledLevelProfile {
    return new ScheduledLevelProfile(
      this.code,
      this.label,
      this.priority,
      this.cohort,
      this.region,
      this.batchSize,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled level profile in status requested. */
export function newScheduledLevelProfile(code: string, label: string): ScheduledLevelProfile {
  return new ScheduledLevelProfile(code, label, 0, "", "", 0, "", "requested");
}
