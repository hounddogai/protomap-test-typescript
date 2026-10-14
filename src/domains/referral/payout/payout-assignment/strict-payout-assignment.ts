/**
 * The strict payout assignment records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict payout assignment is in its life cycle. */
export type StrictPayoutAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A strict payout assignment. Its code is unique within a tenant. */
export class StrictPayoutAssignment {
  code: string;
  label: string;
  weight: number;
  region: string;
  windowDays: number;
  archived: boolean;
  status: StrictPayoutAssignmentStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    region: string,
    windowDays: number,
    archived: boolean,
    status: StrictPayoutAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.region = region;
    this.windowDays = windowDays;
    this.archived = archived;
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

  canMoveTo(next: StrictPayoutAssignmentStatus): boolean {
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictPayoutAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict payout assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict payout assignment"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.weight + this.windowDays) * 100) / 100;
  }

  copy(): StrictPayoutAssignment {
    return new StrictPayoutAssignment(
      this.code,
      this.label,
      this.weight,
      this.region,
      this.windowDays,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict payout assignment in status created. */
export function newStrictPayoutAssignment(code: string, label: string): StrictPayoutAssignment {
  return new StrictPayoutAssignment(code, label, 0, "", 0, false, "created");
}
