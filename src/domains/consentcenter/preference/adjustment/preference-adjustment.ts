/**
 * The preference adjustment records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference adjustment is in its life cycle. */
export type PreferenceAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One preference adjustment, with what the planners need to act on it. */
export class PreferenceAdjustment {
  code: string;
  title: string;
  approved: boolean;
  capacity: number;
  openRate: number;
  retries: number;
  status: PreferenceAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    capacity: number,
    openRate: number,
    retries: number,
    status: PreferenceAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.capacity = capacity;
    this.openRate = openRate;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PreferenceAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.openRate - this.capacity) * 100) / 100;
  }

  copy(): PreferenceAdjustment {
    return new PreferenceAdjustment(
      this.code,
      this.title,
      this.approved,
      this.capacity,
      this.openRate,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a preference adjustment in status proposed. */
export function newPreferenceAdjustment(code: string, title: string): PreferenceAdjustment {
  return new PreferenceAdjustment(code, title, false, 0, 0, 0, "proposed");
}
