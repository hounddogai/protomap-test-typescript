/**
 * The preference snapshot records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference snapshot is in its life cycle. */
export type PreferenceSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a preference snapshot and its current status. */
export class PreferenceSnapshot {
  code: string;
  label: string;
  cost: number;
  rate: number;
  locale: string;
  sendAt: number;
  pinned: boolean;
  windowDays: number;
  timezone: string;
  country: string;
  status: PreferenceSnapshotStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    rate: number,
    locale: string,
    sendAt: number,
    pinned: boolean,
    windowDays: number,
    timezone: string,
    country: string,
    status: PreferenceSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.rate = rate;
    this.locale = locale;
    this.sendAt = sendAt;
    this.pinned = pinned;
    this.windowDays = windowDays;
    this.timezone = timezone;
    this.country = country;
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

  canMoveTo(next: PreferenceSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PreferenceSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netLoad(): number {
    return Math.round((this.sendAt - this.windowDays) * 100) / 100;
  }

  copy(): PreferenceSnapshot {
    return new PreferenceSnapshot(
      this.code,
      this.label,
      this.cost,
      this.rate,
      this.locale,
      this.sendAt,
      this.pinned,
      this.windowDays,
      this.timezone,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a preference snapshot in status open. */
export function newPreferenceSnapshot(code: string, label: string): PreferenceSnapshot {
  return new PreferenceSnapshot(code, label, 0, 0, "", 0, false, 0, "", "", "open");
}
