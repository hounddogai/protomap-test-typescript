/**
 * The global tier entry records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global tier entry is in its life cycle. */
export type GlobalTierEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global tier entry, with what the planners need to act on it. */
export class GlobalTierEntry {
  code: string;
  title: string;
  source: string;
  retries: number;
  country: string;
  active: boolean;
  bid: number;
  archived: boolean;
  status: GlobalTierEntryStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    retries: number,
    country: string,
    active: boolean,
    bid: number,
    archived: boolean,
    status: GlobalTierEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.retries = retries;
    this.country = country;
    this.active = active;
    this.bid = bid;
    this.archived = archived;
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

  canMoveTo(next: GlobalTierEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalTierEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global tier entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global tier entry"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.bid + this.retries) * 100) / 100;
  }

  copy(): GlobalTierEntry {
    return new GlobalTierEntry(
      this.code,
      this.title,
      this.source,
      this.retries,
      this.country,
      this.active,
      this.bid,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global tier entry in status open. */
export function newGlobalTierEntry(code: string, title: string): GlobalTierEntry {
  return new GlobalTierEntry(code, title, "", 0, "", false, 0, false, "open");
}
