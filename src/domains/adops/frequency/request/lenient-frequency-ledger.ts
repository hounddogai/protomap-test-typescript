import * as text from "../../../../kit/text.js";

/** Where a lenient frequency ledger is in its life cycle. */
export type LenientFrequencyLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient frequency ledger and its current status. */
export class LenientFrequencyLedger {
  code: string;
  name: string;
  expiresAt: number;
  locale: string;
  approved: boolean;
  title: string;
  priority: number;
  campaignRef: string;
  timezone: string;
  journeyId: string;
  active: boolean;
  status: LenientFrequencyLedgerStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    locale: string,
    approved: boolean,
    title: string,
    priority: number,
    campaignRef: string,
    timezone: string,
    journeyId: string,
    active: boolean,
    status: LenientFrequencyLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.approved = approved;
    this.title = title;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.journeyId = journeyId;
    this.active = active;
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

  canMoveTo(next: LenientFrequencyLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientFrequencyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient frequency ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.priority + this.expiresAt) * 100) / 100;
  }

  copy(): LenientFrequencyLedger {
    return new LenientFrequencyLedger(
      this.code,
      this.name,
      this.expiresAt,
      this.locale,
      this.approved,
      this.title,
      this.priority,
      this.campaignRef,
      this.timezone,
      this.journeyId,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient frequency ledger in status proposed. */
export function newLenientFrequencyLedger(code: string, name: string): LenientFrequencyLedger {
  return new LenientFrequencyLedger(code, name, 0, "", false, "", 0, "", "", "", false, "proposed");
}
