import * as text from "../../../../kit/text.js";

/** Where a global journey ledger is in its life cycle. */
export type GlobalJourneyLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global journey ledger, with what the planners need to act on it. */
export class GlobalJourneyLedger {
  code: string;
  label: string;
  startsAt: number;
  sendAt: number;
  bid: number;
  frequencyCap: number;
  windowDays: number;
  durationMinutes: number;
  status: GlobalJourneyLedgerStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    sendAt: number,
    bid: number,
    frequencyCap: number,
    windowDays: number,
    durationMinutes: number,
    status: GlobalJourneyLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.sendAt = sendAt;
    this.bid = bid;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: GlobalJourneyLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: GlobalJourneyLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global journey ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global journey ledger"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.bid * this.windowDays * 100) / 100;
  }

  copy(): GlobalJourneyLedger {
    return new GlobalJourneyLedger(
      this.code,
      this.label,
      this.startsAt,
      this.sendAt,
      this.bid,
      this.frequencyCap,
      this.windowDays,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global journey ledger in status proposed. */
export function newGlobalJourneyLedger(code: string, label: string): GlobalJourneyLedger {
  return new GlobalJourneyLedger(code, label, 0, 0, 0, 0, 0, 0, "proposed");
}
