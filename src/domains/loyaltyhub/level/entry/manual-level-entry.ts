/**
 * The manual level entry records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual level entry is in its life cycle. */
export type ManualLevelEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual level entry, with what the planners need to act on it. */
export class ManualLevelEntry {
  code: string;
  label: string;
  active: boolean;
  pinned: boolean;
  timezone: string;
  sendAt: number;
  graceDays: number;
  ratio: number;
  tags: string[];
  contactEmail: string;
  status: ManualLevelEntryStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    pinned: boolean,
    timezone: string,
    sendAt: number,
    graceDays: number,
    ratio: number,
    tags: string[],
    contactEmail: string,
    status: ManualLevelEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.pinned = pinned;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.ratio = ratio;
    this.tags = tags;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ManualLevelEntryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualLevelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual level entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.graceDays - this.ratio) * 100) / 100;
  }

  copy(): ManualLevelEntry {
    return new ManualLevelEntry(
      this.code,
      this.label,
      this.active,
      this.pinned,
      this.timezone,
      this.sendAt,
      this.graceDays,
      this.ratio,
      this.tags,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual level entry in status open. */
export function newManualLevelEntry(code: string, label: string): ManualLevelEntry {
  return new ManualLevelEntry(code, label, false, false, "", 0, 0, 0, [], "", "open");
}
