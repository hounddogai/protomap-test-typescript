/**
 * The preference entry records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference entry is in its life cycle. */
export type PreferenceEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One preference entry, with what the planners need to act on it. */
export class PreferenceEntry {
  code: string;
  label: string;
  title: string;
  contactEmail: string;
  windowDays: number;
  floorValue: number;
  name: string;
  score: number;
  status: PreferenceEntryStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    contactEmail: string,
    windowDays: number,
    floorValue: number,
    name: string,
    score: number,
    status: PreferenceEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.contactEmail = contactEmail;
    this.windowDays = windowDays;
    this.floorValue = floorValue;
    this.name = name;
    this.score = score;
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

  canMoveTo(next: PreferenceEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: PreferenceEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.floorValue - this.score) * 100) / 100;
  }

  copy(): PreferenceEntry {
    return new PreferenceEntry(
      this.code,
      this.label,
      this.title,
      this.contactEmail,
      this.windowDays,
      this.floorValue,
      this.name,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference entry in status open. */
export function newPreferenceEntry(code: string, label: string): PreferenceEntry {
  return new PreferenceEntry(code, label, "", "", 0, 0, "", 0, "open");
}
