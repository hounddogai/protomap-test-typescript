/**
 * The manual placement entry records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual placement entry is in its life cycle. */
export type ManualPlacementEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual placement entry, with what the planners need to act on it. */
export class ManualPlacementEntry {
  code: string;
  title: string;
  priority: number;
  graceDays: number;
  source: string;
  version: number;
  openRate: number;
  durationMinutes: number;
  segment: string;
  updatedAt: number;
  status: ManualPlacementEntryStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    graceDays: number,
    source: string,
    version: number,
    openRate: number,
    durationMinutes: number,
    segment: string,
    updatedAt: number,
    status: ManualPlacementEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.graceDays = graceDays;
    this.source = source;
    this.version = version;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.segment = segment;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: ManualPlacementEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPlacementEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual placement entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round(this.version * this.priority * 100) / 100;
  }

  copy(): ManualPlacementEntry {
    return new ManualPlacementEntry(
      this.code,
      this.title,
      this.priority,
      this.graceDays,
      this.source,
      this.version,
      this.openRate,
      this.durationMinutes,
      this.segment,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual placement entry in status open. */
export function newManualPlacementEntry(code: string, title: string): ManualPlacementEntry {
  return new ManualPlacementEntry(code, title, 0, 0, "", 0, 0, 0, "", 0, "open");
}
