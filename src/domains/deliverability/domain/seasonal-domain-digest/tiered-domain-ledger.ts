import * as text from "../../../../kit/text.js";

/** Where a tiered domain ledger is in its life cycle. */
export type TieredDomainLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered domain ledger and its current status. */
export class TieredDomainLedger {
  code: string;
  name: string;
  currency: string;
  visible: boolean;
  quantity: number;
  openRate: number;
  pinned: boolean;
  status: TieredDomainLedgerStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    visible: boolean,
    quantity: number,
    openRate: number,
    pinned: boolean,
    status: TieredDomainLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.visible = visible;
    this.quantity = quantity;
    this.openRate = openRate;
    this.pinned = pinned;
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

  canMoveTo(next: TieredDomainLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
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

  moveTo(next: TieredDomainLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered domain ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round(this.quantity * this.openRate * 100) / 100;
  }

  copy(): TieredDomainLedger {
    return new TieredDomainLedger(
      this.code,
      this.name,
      this.currency,
      this.visible,
      this.quantity,
      this.openRate,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered domain ledger in status proposed. */
export function newTieredDomainLedger(code: string, name: string): TieredDomainLedger {
  return new TieredDomainLedger(code, name, "", false, 0, 0, false, "proposed");
}
