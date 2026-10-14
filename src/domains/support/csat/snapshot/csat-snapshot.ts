/**
 * The csat snapshot records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat snapshot is in its life cycle. */
export type CsatSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One csat snapshot, with what the planners need to act on it. */
export class CsatSnapshot {
  code: string;
  label: string;
  name: string;
  title: string;
  approved: boolean;
  expiresAt: number;
  cohort: string;
  budget: number;
  priority: number;
  channel: string;
  unit: string;
  status: CsatSnapshotStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    title: string,
    approved: boolean,
    expiresAt: number,
    cohort: string,
    budget: number,
    priority: number,
    channel: string,
    unit: string,
    status: CsatSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.title = title;
    this.approved = approved;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
    this.budget = budget;
    this.priority = priority;
    this.channel = channel;
    this.unit = unit;
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

  canMoveTo(next: CsatSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
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

  moveTo(next: CsatSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"csat snapshot"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.priority - this.budget) * 100) / 100;
  }

  copy(): CsatSnapshot {
    return new CsatSnapshot(
      this.code,
      this.label,
      this.name,
      this.title,
      this.approved,
      this.expiresAt,
      this.cohort,
      this.budget,
      this.priority,
      this.channel,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a csat snapshot in status draft. */
export function newCsatSnapshot(code: string, label: string): CsatSnapshot {
  return new CsatSnapshot(code, label, "", "", false, 0, "", 0, 0, "", "", "draft");
}
