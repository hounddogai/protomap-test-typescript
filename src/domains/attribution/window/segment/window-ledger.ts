import * as text from "../../../../kit/text.js";

/** Where a window ledger is in its life cycle. */
export type WindowLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a window ledger and its current status. */
export class WindowLedger {
  code: string;
  name: string;
  updatedAt: number;
  clicks: number;
  approved: boolean;
  minimum: number;
  contactEmail: string;
  externalRef: string;
  campaignRef: string;
  status: WindowLedgerStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    clicks: number,
    approved: boolean,
    minimum: number,
    contactEmail: string,
    externalRef: string,
    campaignRef: string,
    status: WindowLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.clicks = clicks;
    this.approved = approved;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: WindowLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: WindowLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"window ledger"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.minimum - this.updatedAt) * 100) / 100;
  }

  copy(): WindowLedger {
    return new WindowLedger(
      this.code,
      this.name,
      this.updatedAt,
      this.clicks,
      this.approved,
      this.minimum,
      this.contactEmail,
      this.externalRef,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a window ledger in status proposed. */
export function newWindowLedger(code: string, name: string): WindowLedger {
  return new WindowLedger(code, name, 0, 0, false, 0, "", "", "", "proposed");
}
