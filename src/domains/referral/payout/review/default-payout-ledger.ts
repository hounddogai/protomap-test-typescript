import * as text from "../../../../kit/text.js";

/** Where a default payout ledger is in its life cycle. */
export type DefaultPayoutLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default payout ledger and its current status. */
export class DefaultPayoutLedger {
  code: string;
  title: string;
  phone: string;
  externalRef: string;
  ratio: number;
  bid: number;
  status: DefaultPayoutLedgerStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    externalRef: string,
    ratio: number,
    bid: number,
    status: DefaultPayoutLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.bid = bid;
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

  canMoveTo(next: DefaultPayoutLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: DefaultPayoutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default payout ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.bid - this.ratio) * 100) / 100;
  }

  copy(): DefaultPayoutLedger {
    return new DefaultPayoutLedger(
      this.code,
      this.title,
      this.phone,
      this.externalRef,
      this.ratio,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default payout ledger in status proposed. */
export function newDefaultPayoutLedger(code: string, title: string): DefaultPayoutLedger {
  return new DefaultPayoutLedger(code, title, "", "", 0, 0, "proposed");
}
