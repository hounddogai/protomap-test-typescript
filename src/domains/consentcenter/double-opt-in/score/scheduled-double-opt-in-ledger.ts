import * as text from "../../../../kit/text.js";

/** Where a scheduled double opt in ledger is in its life cycle. */
export type ScheduledDoubleOptInLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a scheduled double opt in ledger and its current status. */
export class ScheduledDoubleOptInLedger {
  code: string;
  title: string;
  score: number;
  channel: string;
  externalRef: string;
  impressions: number;
  category: string;
  durationMinutes: number;
  status: ScheduledDoubleOptInLedgerStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    channel: string,
    externalRef: string,
    impressions: number,
    category: string,
    durationMinutes: number,
    status: ScheduledDoubleOptInLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.channel = channel;
    this.externalRef = externalRef;
    this.impressions = impressions;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledDoubleOptInLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDoubleOptInLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled double opt in ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled double opt in ledger"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.durationMinutes - this.impressions) * 100) / 100;
  }

  copy(): ScheduledDoubleOptInLedger {
    return new ScheduledDoubleOptInLedger(
      this.code,
      this.title,
      this.score,
      this.channel,
      this.externalRef,
      this.impressions,
      this.category,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled double opt in ledger in status requested. */
export function newScheduledDoubleOptInLedger(code: string, title: string): ScheduledDoubleOptInLedger {
  return new ScheduledDoubleOptInLedger(code, title, 0, "", "", 0, "", 0, "requested");
}
