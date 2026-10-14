/**
 * The branch baseline records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch baseline is in its life cycle. */
export type BranchBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A branch baseline as the branch team keeps it. */
export class BranchBaseline {
  code: string;
  title: string;
  maximum: number;
  floorValue: number;
  notes: string;
  status: BranchBaselineStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    floorValue: number,
    notes: string,
    status: BranchBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.notes = notes;
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

  canMoveTo(next: BranchBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BranchBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.maximum * this.floorValue * 100) / 100;
  }

  copy(): BranchBaseline {
    return new BranchBaseline(this.code, this.title, this.maximum, this.floorValue, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch baseline in status open. */
export function newBranchBaseline(code: string, title: string): BranchBaseline {
  return new BranchBaseline(code, title, 0, 0, "", "open");
}
