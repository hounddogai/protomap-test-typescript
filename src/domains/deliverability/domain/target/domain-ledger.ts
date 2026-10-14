import * as text from "../../../../kit/text.js";

/** Where a domain ledger is in its life cycle. */
export type DomainLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a domain ledger and its current status. */
export class DomainLedger {
  code: string;
  name: string;
  bid: number;
  openRate: number;
  updatedAt: number;
  campaignRef: string;
  discount: number;
  contactEmail: string;
  active: boolean;
  status: DomainLedgerStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    openRate: number,
    updatedAt: number,
    campaignRef: string,
    discount: number,
    contactEmail: string,
    active: boolean,
    status: DomainLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"domain ledger"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.openRate - this.bid) * 100) / 100;
  }

  copy(): DomainLedger {
    return new DomainLedger(
      this.code,
      this.name,
      this.bid,
      this.openRate,
      this.updatedAt,
      this.campaignRef,
      this.discount,
      this.contactEmail,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a domain ledger in status new. */
export function newDomainLedger(code: string, name: string): DomainLedger {
  return new DomainLedger(code, name, 0, 0, 0, "", 0, "", false, "new");
}
