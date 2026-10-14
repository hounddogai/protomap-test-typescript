import * as text from "../../../../kit/text.js";

/** Where a double opt in ledger is in its life cycle. */
export type DoubleOptInLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a double opt in ledger and its current status. */
export class DoubleOptInLedger {
  code: string;
  title: string;
  margin: number;
  startsAt: number;
  locale: string;
  durationMinutes: number;
  pinned: boolean;
  contactEmail: string;
  audienceId: string;
  revision: number;
  expiresAt: number;
  status: DoubleOptInLedgerStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    startsAt: number,
    locale: string,
    durationMinutes: number,
    pinned: boolean,
    contactEmail: string,
    audienceId: string,
    revision: number,
    expiresAt: number,
    status: DoubleOptInLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.startsAt = startsAt;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.pinned = pinned;
    this.contactEmail = contactEmail;
    this.audienceId = audienceId;
    this.revision = revision;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: DoubleOptInLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.durationMinutes + this.startsAt) * 100) / 100;
  }

  copy(): DoubleOptInLedger {
    return new DoubleOptInLedger(
      this.code,
      this.title,
      this.margin,
      this.startsAt,
      this.locale,
      this.durationMinutes,
      this.pinned,
      this.contactEmail,
      this.audienceId,
      this.revision,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a double opt in ledger in status proposed. */
export function newDoubleOptInLedger(code: string, title: string): DoubleOptInLedger {
  return new DoubleOptInLedger(code, title, 0, 0, "", 0, false, "", "", 0, 0, "proposed");
}
