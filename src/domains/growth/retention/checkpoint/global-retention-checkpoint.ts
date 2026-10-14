/**
 * The global retention checkpoint records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global retention checkpoint is in its life cycle. */
export type GlobalRetentionCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global retention checkpoint as the retention team keeps it. */
export class GlobalRetentionCheckpoint {
  code: string;
  title: string;
  unit: string;
  version: number;
  priority: number;
  status: GlobalRetentionCheckpointStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    version: number,
    priority: number,
    status: GlobalRetentionCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.version = version;
    this.priority = priority;
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

  canMoveTo(next: GlobalRetentionCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRetentionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedLoad(): number {
    return Math.round((this.version - this.priority) * 100) / 100;
  }

  copy(): GlobalRetentionCheckpoint {
    return new GlobalRetentionCheckpoint(this.code, this.title, this.unit, this.version, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global retention checkpoint in status draft. */
export function newGlobalRetentionCheckpoint(code: string, title: string): GlobalRetentionCheckpoint {
  return new GlobalRetentionCheckpoint(code, title, "", 0, 0, "draft");
}
