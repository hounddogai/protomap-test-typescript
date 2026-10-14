/**
 * The regional preference snapshot records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional preference snapshot is in its life cycle. */
export type RegionalPreferenceSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional preference snapshot as the preference team keeps it. */
export class RegionalPreferenceSnapshot {
  code: string;
  label: string;
  attempts: number;
  openRate: number;
  name: string;
  phone: string;
  cohort: string;
  status: RegionalPreferenceSnapshotStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    openRate: number,
    name: string,
    phone: string,
    cohort: string,
    status: RegionalPreferenceSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.openRate = openRate;
    this.name = name;
    this.phone = phone;
    this.cohort = cohort;
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

  canMoveTo(next: RegionalPreferenceSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RegionalPreferenceSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional preference snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional preference snapshot"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.attempts - this.openRate) * 100) / 100;
  }

  copy(): RegionalPreferenceSnapshot {
    return new RegionalPreferenceSnapshot(
      this.code,
      this.label,
      this.attempts,
      this.openRate,
      this.name,
      this.phone,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional preference snapshot in status planned. */
export function newRegionalPreferenceSnapshot(code: string, label: string): RegionalPreferenceSnapshot {
  return new RegionalPreferenceSnapshot(code, label, 0, 0, "", "", "", "planned");
}
