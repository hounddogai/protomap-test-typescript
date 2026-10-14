import * as text from "../../../../kit/text.js";

/** Where a default credit ledger is in its life cycle. */
export type DefaultCreditLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default credit ledger and its current status. */
export class DefaultCreditLedger {
  code: string;
  title: string;
  archived: boolean;
  frequencyCap: number;
  segment: string;
  batchSize: number;
  active: boolean;
  reviewer: string;
  status: DefaultCreditLedgerStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    frequencyCap: number,
    segment: string,
    batchSize: number,
    active: boolean,
    reviewer: string,
    status: DefaultCreditLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.batchSize = batchSize;
    this.active = active;
    this.reviewer = reviewer;
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

  canMoveTo(next: DefaultCreditLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultCreditLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default credit ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.batchSize + this.frequencyCap) * 100) / 100;
  }

  copy(): DefaultCreditLedger {
    return new DefaultCreditLedger(
      this.code,
      this.title,
      this.archived,
      this.frequencyCap,
      this.segment,
      this.batchSize,
      this.active,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default credit ledger in status proposed. */
export function newDefaultCreditLedger(code: string, title: string): DefaultCreditLedger {
  return new DefaultCreditLedger(code, title, false, 0, "", 0, false, "", "proposed");
}
