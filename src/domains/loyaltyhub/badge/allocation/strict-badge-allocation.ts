/**
 * The strict badge allocation records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict badge allocation is in its life cycle. */
export type StrictBadgeAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict badge allocation, with what the planners need to act on it. */
export class StrictBadgeAllocation {
  code: string;
  title: string;
  frequencyCap: number;
  score: number;
  attempts: number;
  graceDays: number;
  version: number;
  capacity: number;
  revision: number;
  active: boolean;
  status: StrictBadgeAllocationStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    score: number,
    attempts: number,
    graceDays: number,
    version: number,
    capacity: number,
    revision: number,
    active: boolean,
    status: StrictBadgeAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.attempts = attempts;
    this.graceDays = graceDays;
    this.version = version;
    this.capacity = capacity;
    this.revision = revision;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictBadgeAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictBadgeAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict badge allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"strict badge allocation"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.score - this.frequencyCap) * 100) / 100;
  }

  copy(): StrictBadgeAllocation {
    return new StrictBadgeAllocation(
      this.code,
      this.title,
      this.frequencyCap,
      this.score,
      this.attempts,
      this.graceDays,
      this.version,
      this.capacity,
      this.revision,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict badge allocation in status new. */
export function newStrictBadgeAllocation(code: string, title: string): StrictBadgeAllocation {
  return new StrictBadgeAllocation(code, title, 0, 0, 0, 0, 0, 0, 0, false, "new");
}
