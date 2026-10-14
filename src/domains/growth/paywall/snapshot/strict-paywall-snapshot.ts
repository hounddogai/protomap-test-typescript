/**
 * The strict paywall snapshot records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict paywall snapshot is in its life cycle. */
export type StrictPaywallSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict paywall snapshot. Its code is unique within a tenant. */
export class StrictPaywallSnapshot {
  code: string;
  title: string;
  bid: number;
  impressions: number;
  notes: string;
  audienceId: string;
  unit: string;
  locale: string;
  source: string;
  status: StrictPaywallSnapshotStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    impressions: number,
    notes: string,
    audienceId: string,
    unit: string,
    locale: string,
    source: string,
    status: StrictPaywallSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.impressions = impressions;
    this.notes = notes;
    this.audienceId = audienceId;
    this.unit = unit;
    this.locale = locale;
    this.source = source;
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

  canMoveTo(next: StrictPaywallSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictPaywallSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict paywall snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict paywall snapshot"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.bid * this.impressions * 100) / 100;
  }

  copy(): StrictPaywallSnapshot {
    return new StrictPaywallSnapshot(
      this.code,
      this.title,
      this.bid,
      this.impressions,
      this.notes,
      this.audienceId,
      this.unit,
      this.locale,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict paywall snapshot in status draft. */
export function newStrictPaywallSnapshot(code: string, title: string): StrictPaywallSnapshot {
  return new StrictPaywallSnapshot(code, title, 0, 0, "", "", "", "", "", "draft");
}
