import * as text from "../../../../kit/text.js";

/** Where a default path ledger is in its life cycle. */
export type DefaultPathLedgerStatus = "created" | "validated" | "published" | "retired";

/** The record of a default path ledger and its current status. */
export class DefaultPathLedger {
  code: string;
  name: string;
  cohort: string;
  windowDays: number;
  currency: string;
  status: DefaultPathLedgerStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    windowDays: number,
    currency: string,
    status: DefaultPathLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultPathLedgerStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPathLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default path ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default path ledger"} ${this.code}`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): DefaultPathLedger {
    return new DefaultPathLedger(this.code, this.name, this.cohort, this.windowDays, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default path ledger in status created. */
export function newDefaultPathLedger(code: string, name: string): DefaultPathLedger {
  return new DefaultPathLedger(code, name, "", 0, "", "created");
}
