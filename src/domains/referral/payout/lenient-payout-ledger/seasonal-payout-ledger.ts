/**
 * The seasonal payout ledger records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal payout ledger is in its life cycle. */
export type SeasonalPayoutLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal payout ledger. Its code is unique within a tenant. */
export class SeasonalPayoutLedger {
  code: string;
  title: string;
  label: string;
  channel: string;
  archived: boolean;
  priority: number;
  ratio: number;
  source: string;
  utmSource: string;
  durationMinutes: number;
  attempts: number;
  status: SeasonalPayoutLedgerStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    channel: string,
    archived: boolean,
    priority: number,
    ratio: number,
    source: string,
    utmSource: string,
    durationMinutes: number,
    attempts: number,
    status: SeasonalPayoutLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.channel = channel;
    this.archived = archived;
    this.priority = priority;
    this.ratio = ratio;
    this.source = source;
    this.utmSource = utmSource;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
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

  canMoveTo(next: SeasonalPayoutLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPayoutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal payout ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.attempts + this.durationMinutes) * 100) / 100;
  }

  copy(): SeasonalPayoutLedger {
    return new SeasonalPayoutLedger(
      this.code,
      this.title,
      this.label,
      this.channel,
      this.archived,
      this.priority,
      this.ratio,
      this.source,
      this.utmSource,
      this.durationMinutes,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal payout ledger in status new. */
export function newSeasonalPayoutLedger(code: string, title: string): SeasonalPayoutLedger {
  return new SeasonalPayoutLedger(code, title, "", "", false, 0, 0, "", "", 0, 0, "new");
}
