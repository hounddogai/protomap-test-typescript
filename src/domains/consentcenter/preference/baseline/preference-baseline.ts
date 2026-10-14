/**
 * The preference baseline records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference baseline is in its life cycle. */
export type PreferenceBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A preference baseline. Its code is unique within a tenant. */
export class PreferenceBaseline {
  code: string;
  name: string;
  bid: number;
  active: boolean;
  retries: number;
  durationMinutes: number;
  reviewer: string;
  checksum: string;
  externalRef: string;
  attempts: number;
  minimum: number;
  status: PreferenceBaselineStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    active: boolean,
    retries: number,
    durationMinutes: number,
    reviewer: string,
    checksum: string,
    externalRef: string,
    attempts: number,
    minimum: number,
    status: PreferenceBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.active = active;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.minimum = minimum;
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

  canMoveTo(next: PreferenceBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PreferenceBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.bid * this.minimum * 100) / 100;
  }

  copy(): PreferenceBaseline {
    return new PreferenceBaseline(
      this.code,
      this.name,
      this.bid,
      this.active,
      this.retries,
      this.durationMinutes,
      this.reviewer,
      this.checksum,
      this.externalRef,
      this.attempts,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference baseline in status open. */
export function newPreferenceBaseline(code: string, name: string): PreferenceBaseline {
  return new PreferenceBaseline(code, name, 0, false, 0, 0, "", "", "", 0, 0, "open");
}
