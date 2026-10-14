/**
 * The regional streak snapshot records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional streak snapshot is in its life cycle. */
export type RegionalStreakSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional streak snapshot as the streak team keeps it. */
export class RegionalStreakSnapshot {
  code: string;
  title: string;
  rate: number;
  margin: number;
  revision: number;
  impressions: number;
  status: RegionalStreakSnapshotStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    margin: number,
    revision: number,
    impressions: number,
    status: RegionalStreakSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.margin = margin;
    this.revision = revision;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalStreakSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalStreakSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional streak snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"regional streak snapshot"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.impressions + this.rate) * 100) / 100;
  }

  copy(): RegionalStreakSnapshot {
    return new RegionalStreakSnapshot(
      this.code,
      this.title,
      this.rate,
      this.margin,
      this.revision,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional streak snapshot in status planned. */
export function newRegionalStreakSnapshot(code: string, title: string): RegionalStreakSnapshot {
  return new RegionalStreakSnapshot(code, title, 0, 0, 0, 0, "planned");
}
