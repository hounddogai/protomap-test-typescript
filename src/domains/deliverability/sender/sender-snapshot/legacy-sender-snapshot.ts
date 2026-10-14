/**
 * The legacy sender snapshot records of deliverability's sender work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy sender snapshot is in its life cycle. */
export type LegacySenderSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy sender snapshot as the sender team keeps it. */
export class LegacySenderSnapshot {
  code: string;
  name: string;
  windowDays: number;
  updatedAt: number;
  active: boolean;
  status: LegacySenderSnapshotStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    updatedAt: number,
    active: boolean,
    status: LegacySenderSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.updatedAt = updatedAt;
    this.active = active;
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

  canMoveTo(next: LegacySenderSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
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

  moveTo(next: LegacySenderSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy sender snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy sender snapshot"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.windowDays * this.updatedAt * 100) / 100;
  }

  copy(): LegacySenderSnapshot {
    return new LegacySenderSnapshot(this.code, this.name, this.windowDays, this.updatedAt, this.active, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy sender snapshot in status draft. */
export function newLegacySenderSnapshot(code: string, name: string): LegacySenderSnapshot {
  return new LegacySenderSnapshot(code, name, 0, 0, false, "draft");
}
