/**
 * The scheduled invite entry records of referral's invite work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled invite entry is in its life cycle. */
export type ScheduledInviteEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a scheduled invite entry and its current status. */
export class ScheduledInviteEntry {
  code: string;
  label: string;
  budget: number;
  externalRef: string;
  conversionRate: number;
  status: ScheduledInviteEntryStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    externalRef: string,
    conversionRate: number,
    status: ScheduledInviteEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ScheduledInviteEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledInviteEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled invite entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round(this.conversionRate * this.budget * 100) / 100;
  }

  copy(): ScheduledInviteEntry {
    return new ScheduledInviteEntry(
      this.code,
      this.label,
      this.budget,
      this.externalRef,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled invite entry in status open. */
export function newScheduledInviteEntry(code: string, label: string): ScheduledInviteEntry {
  return new ScheduledInviteEntry(code, label, 0, "", 0, "open");
}
