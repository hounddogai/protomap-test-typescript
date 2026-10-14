/**
 * The regional wait snapshot records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional wait snapshot is in its life cycle. */
export type RegionalWaitSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a regional wait snapshot and its current status. */
export class RegionalWaitSnapshot {
  code: string;
  title: string;
  description: string;
  priority: number;
  windowDays: number;
  status: RegionalWaitSnapshotStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    priority: number,
    windowDays: number,
    status: RegionalWaitSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.windowDays = windowDays;
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

  canMoveTo(next: RegionalWaitSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalWaitSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional wait snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.windowDays + this.priority) * 100) / 100;
  }

  copy(): RegionalWaitSnapshot {
    return new RegionalWaitSnapshot(
      this.code,
      this.title,
      this.description,
      this.priority,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional wait snapshot in status requested. */
export function newRegionalWaitSnapshot(code: string, title: string): RegionalWaitSnapshot {
  return new RegionalWaitSnapshot(code, title, "", 0, 0, "requested");
}
