/**
 * The complaint ledger records of deliverability's complaint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a complaint ledger is in its life cycle. */
export type ComplaintLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A complaint ledger as the complaint team keeps it. */
export class ComplaintLedger {
  code: string;
  title: string;
  reviewer: string;
  locale: string;
  checksum: string;
  version: number;
  status: ComplaintLedgerStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    locale: string,
    checksum: string,
    version: number,
    status: ComplaintLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.locale = locale;
    this.checksum = checksum;
    this.version = version;
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

  canMoveTo(next: ComplaintLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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

  moveTo(next: ComplaintLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): ComplaintLedger {
    return new ComplaintLedger(
      this.code,
      this.title,
      this.reviewer,
      this.locale,
      this.checksum,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a complaint ledger in status proposed. */
export function newComplaintLedger(code: string, title: string): ComplaintLedger {
  return new ComplaintLedger(code, title, "", "", "", 0, "proposed");
}
