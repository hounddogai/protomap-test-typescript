import * as text from "../../../../kit/text.js";

/** Where a adaptive ticket view ledger is in its life cycle. */
export type AdaptiveTicketViewLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive ticket view ledger as the ticket view team keeps it. */
export class AdaptiveTicketViewLedger {
  code: string;
  label: string;
  unit: string;
  variant: string;
  amount: number;
  updatedAt: number;
  sequence: number;
  timezone: string;
  audienceId: string;
  cohort: string;
  ceiling: number;
  status: AdaptiveTicketViewLedgerStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    variant: string,
    amount: number,
    updatedAt: number,
    sequence: number,
    timezone: string,
    audienceId: string,
    cohort: string,
    ceiling: number,
    status: AdaptiveTicketViewLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.variant = variant;
    this.amount = amount;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.cohort = cohort;
    this.ceiling = ceiling;
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

  canMoveTo(next: AdaptiveTicketViewLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveTicketViewLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive ticket view ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.sequence - this.updatedAt) * 100) / 100;
  }

  copy(): AdaptiveTicketViewLedger {
    return new AdaptiveTicketViewLedger(
      this.code,
      this.label,
      this.unit,
      this.variant,
      this.amount,
      this.updatedAt,
      this.sequence,
      this.timezone,
      this.audienceId,
      this.cohort,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive ticket view ledger in status open. */
export function newAdaptiveTicketViewLedger(code: string, label: string): AdaptiveTicketViewLedger {
  return new AdaptiveTicketViewLedger(code, label, "", "", 0, 0, 0, "", "", "", 0, "open");
}
