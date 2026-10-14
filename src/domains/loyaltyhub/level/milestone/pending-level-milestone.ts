/**
 * The pending level milestone records of loyaltyhub's level work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending level milestone is in its life cycle. */
export type PendingLevelMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending level milestone and its current status. */
export class PendingLevelMilestone {
  code: string;
  label: string;
  utmSource: string;
  ceiling: number;
  endsAt: number;
  approved: boolean;
  status: PendingLevelMilestoneStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    ceiling: number,
    endsAt: number,
    approved: boolean,
    status: PendingLevelMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.ceiling = ceiling;
    this.endsAt = endsAt;
    this.approved = approved;
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

  canMoveTo(next: PendingLevelMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingLevelMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending level milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.endsAt * this.ceiling * 100) / 100;
  }

  copy(): PendingLevelMilestone {
    return new PendingLevelMilestone(
      this.code,
      this.label,
      this.utmSource,
      this.ceiling,
      this.endsAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending level milestone in status draft. */
export function newPendingLevelMilestone(code: string, label: string): PendingLevelMilestone {
  return new PendingLevelMilestone(code, label, "", 0, 0, false, "draft");
}
