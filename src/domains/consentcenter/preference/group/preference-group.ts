/**
 * The preference group records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference group is in its life cycle. */
export type PreferenceGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One preference group, with what the planners need to act on it. */
export class PreferenceGroup {
  code: string;
  title: string;
  sendAt: number;
  discount: number;
  reviewer: string;
  cohort: string;
  status: PreferenceGroupStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    discount: number,
    reviewer: string,
    cohort: string,
    status: PreferenceGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.discount = discount;
    this.reviewer = reviewer;
    this.cohort = cohort;
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

  canMoveTo(next: PreferenceGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PreferenceGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.sendAt + this.discount) * 100) / 100;
  }

  copy(): PreferenceGroup {
    return new PreferenceGroup(
      this.code,
      this.title,
      this.sendAt,
      this.discount,
      this.reviewer,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a preference group in status new. */
export function newPreferenceGroup(code: string, title: string): PreferenceGroup {
  return new PreferenceGroup(code, title, 0, 0, "", "", "new");
}
