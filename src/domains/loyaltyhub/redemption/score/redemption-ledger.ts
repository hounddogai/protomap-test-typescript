import * as text from "../../../../kit/text.js";

/** Where a redemption ledger is in its life cycle. */
export type RedemptionLedgerStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a redemption ledger and its current status. */
export class RedemptionLedger {
  code: string;
  name: string;
  source: string;
  conversionRate: number;
  checksum: string;
  status: RedemptionLedgerStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    conversionRate: number,
    checksum: string,
    status: RedemptionLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
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

  canMoveTo(next: RedemptionLedgerStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"redemption ledger"} ${this.code}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): RedemptionLedger {
    return new RedemptionLedger(this.code, this.name, this.source, this.conversionRate, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a redemption ledger in status open. */
export function newRedemptionLedger(code: string, name: string): RedemptionLedger {
  return new RedemptionLedger(code, name, "", 0, "", "open");
}
