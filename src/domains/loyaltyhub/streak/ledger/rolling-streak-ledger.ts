/**
 * The rolling streak ledger records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling streak ledger is in its life cycle. */
export type RollingStreakLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A rolling streak ledger as the streak team keeps it. */
export class RollingStreakLedger {
  code: string;
  title: string;
  source: string;
  utmSource: string;
  windowDays: number;
  campaignRef: string;
  expiresAt: number;
  floorValue: number;
  sequence: number;
  country: string;
  locale: string;
  status: RollingStreakLedgerStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    utmSource: string,
    windowDays: number,
    campaignRef: string,
    expiresAt: number,
    floorValue: number,
    sequence: number,
    country: string,
    locale: string,
    status: RollingStreakLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.expiresAt = expiresAt;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.country = country;
    this.locale = locale;
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

  canMoveTo(next: RollingStreakLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingStreakLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling streak ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling streak ledger"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.sequence + this.windowDays) * 100) / 100;
  }

  copy(): RollingStreakLedger {
    return new RollingStreakLedger(
      this.code,
      this.title,
      this.source,
      this.utmSource,
      this.windowDays,
      this.campaignRef,
      this.expiresAt,
      this.floorValue,
      this.sequence,
      this.country,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a rolling streak ledger in status proposed. */
export function newRollingStreakLedger(code: string, title: string): RollingStreakLedger {
  return new RollingStreakLedger(code, title, "", "", 0, "", 0, 0, 0, "", "", "proposed");
}
