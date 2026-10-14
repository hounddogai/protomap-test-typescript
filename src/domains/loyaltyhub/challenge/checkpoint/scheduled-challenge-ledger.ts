import * as text from "../../../../kit/text.js";

/** Where a scheduled challenge ledger is in its life cycle. */
export type ScheduledChallengeLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a scheduled challenge ledger and its current status. */
export class ScheduledChallengeLedger {
  code: string;
  title: string;
  country: string;
  ratio: number;
  locale: string;
  revision: number;
  conversionRate: number;
  phone: string;
  status: ScheduledChallengeLedgerStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    ratio: number,
    locale: string,
    revision: number,
    conversionRate: number,
    phone: string,
    status: ScheduledChallengeLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.ratio = ratio;
    this.locale = locale;
    this.revision = revision;
    this.conversionRate = conversionRate;
    this.phone = phone;
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

  canMoveTo(next: ScheduledChallengeLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledChallengeLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled challenge ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round((this.ratio + this.conversionRate) * 100) / 100;
  }

  copy(): ScheduledChallengeLedger {
    return new ScheduledChallengeLedger(
      this.code,
      this.title,
      this.country,
      this.ratio,
      this.locale,
      this.revision,
      this.conversionRate,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled challenge ledger in status requested. */
export function newScheduledChallengeLedger(code: string, title: string): ScheduledChallengeLedger {
  return new ScheduledChallengeLedger(code, title, "", 0, "", 0, 0, "", "requested");
}
