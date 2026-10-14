/**
 * The primary badge entry records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary badge entry is in its life cycle. */
export type PrimaryBadgeEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary badge entry. Its code is unique within a tenant. */
export class PrimaryBadgeEntry {
  code: string;
  label: string;
  reviewer: string;
  windowDays: number;
  approved: boolean;
  budget: number;
  limit: number;
  locale: string;
  audienceId: string;
  status: PrimaryBadgeEntryStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    windowDays: number,
    approved: boolean,
    budget: number,
    limit: number,
    locale: string,
    audienceId: string,
    status: PrimaryBadgeEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.approved = approved;
    this.budget = budget;
    this.limit = limit;
    this.locale = locale;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryBadgeEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryBadgeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary badge entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round(this.limit * this.budget * 100) / 100;
  }

  copy(): PrimaryBadgeEntry {
    return new PrimaryBadgeEntry(
      this.code,
      this.label,
      this.reviewer,
      this.windowDays,
      this.approved,
      this.budget,
      this.limit,
      this.locale,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary badge entry in status idle. */
export function newPrimaryBadgeEntry(code: string, label: string): PrimaryBadgeEntry {
  return new PrimaryBadgeEntry(code, label, "", 0, false, 0, 0, "", "", "idle");
}
