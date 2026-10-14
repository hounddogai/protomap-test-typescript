import * as text from "../../../../kit/text.js";

/** Where a wait ledger is in its life cycle. */
export type WaitLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A wait ledger as the wait team keeps it. */
export class WaitLedger {
  code: string;
  name: string;
  channel: string;
  windowDays: number;
  graceDays: number;
  summary: string;
  pinned: boolean;
  retries: number;
  locale: string;
  score: number;
  status: WaitLedgerStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    windowDays: number,
    graceDays: number,
    summary: string,
    pinned: boolean,
    retries: number,
    locale: string,
    score: number,
    status: WaitLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.windowDays = windowDays;
    this.graceDays = graceDays;
    this.summary = summary;
    this.pinned = pinned;
    this.retries = retries;
    this.locale = locale;
    this.score = score;
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

  canMoveTo(next: WaitLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WaitLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.graceDays + this.windowDays) * 100) / 100;
  }

  copy(): WaitLedger {
    return new WaitLedger(
      this.code,
      this.name,
      this.channel,
      this.windowDays,
      this.graceDays,
      this.summary,
      this.pinned,
      this.retries,
      this.locale,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a wait ledger in status proposed. */
export function newWaitLedger(code: string, name: string): WaitLedger {
  return new WaitLedger(code, name, "", 0, 0, "", false, 0, "", 0, "proposed");
}
