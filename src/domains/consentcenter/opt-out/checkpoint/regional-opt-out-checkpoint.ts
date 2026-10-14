/**
 * The regional opt out checkpoint records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional opt out checkpoint is in its life cycle. */
export type RegionalOptOutCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One regional opt out checkpoint, with what the planners need to act on it. */
export class RegionalOptOutCheckpoint {
  code: string;
  label: string;
  graceDays: number;
  approved: boolean;
  conversionRate: number;
  version: number;
  status: RegionalOptOutCheckpointStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    approved: boolean,
    conversionRate: number,
    version: number,
    status: RegionalOptOutCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.approved = approved;
    this.conversionRate = conversionRate;
    this.version = version;
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

  canMoveTo(next: RegionalOptOutCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalOptOutCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional opt out checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"regional opt out checkpoint"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.graceDays * this.version * 100) / 100;
  }

  copy(): RegionalOptOutCheckpoint {
    return new RegionalOptOutCheckpoint(
      this.code,
      this.label,
      this.graceDays,
      this.approved,
      this.conversionRate,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional opt out checkpoint in status planned. */
export function newRegionalOptOutCheckpoint(code: string, label: string): RegionalOptOutCheckpoint {
  return new RegionalOptOutCheckpoint(code, label, 0, false, 0, 0, "planned");
}
