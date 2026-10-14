/**
 * The primary opt out entry records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary opt out entry is in its life cycle. */
export type PrimaryOptOutEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One primary opt out entry, with what the planners need to act on it. */
export class PrimaryOptOutEntry {
  code: string;
  label: string;
  tags: string[];
  batchSize: number;
  expiresAt: number;
  currency: string;
  cohort: string;
  status: PrimaryOptOutEntryStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    batchSize: number,
    expiresAt: number,
    currency: string,
    cohort: string,
    status: PrimaryOptOutEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.batchSize = batchSize;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.cohort = cohort;
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

  canMoveTo(next: PrimaryOptOutEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryOptOutEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary opt out entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round(this.expiresAt * this.batchSize * 100) / 100;
  }

  copy(): PrimaryOptOutEntry {
    return new PrimaryOptOutEntry(
      this.code,
      this.label,
      this.tags,
      this.batchSize,
      this.expiresAt,
      this.currency,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary opt out entry in status draft. */
export function newPrimaryOptOutEntry(code: string, label: string): PrimaryOptOutEntry {
  return new PrimaryOptOutEntry(code, label, [], 0, 0, "", "", "draft");
}
