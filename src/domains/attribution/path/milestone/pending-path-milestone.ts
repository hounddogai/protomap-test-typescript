/**
 * The pending path milestone records of attribution's path work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending path milestone is in its life cycle. */
export type PendingPathMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending path milestone. Its code is unique within a tenant. */
export class PendingPathMilestone {
  code: string;
  name: string;
  minimum: number;
  checksum: string;
  version: number;
  status: PendingPathMilestoneStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    checksum: string,
    version: number,
    status: PendingPathMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.checksum = checksum;
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

  canMoveTo(next: PendingPathMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingPathMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending path milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"pending path milestone"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.minimum + this.version) * 100) / 100;
  }

  copy(): PendingPathMilestone {
    return new PendingPathMilestone(this.code, this.name, this.minimum, this.checksum, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending path milestone in status planned. */
export function newPendingPathMilestone(code: string, name: string): PendingPathMilestone {
  return new PendingPathMilestone(code, name, 0, "", 0, "planned");
}
