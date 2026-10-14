import * as text from "../../../../kit/text.js";

/** Where a regional paywall ledger is in its life cycle. */
export type RegionalPaywallLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional paywall ledger. Its code is unique within a tenant. */
export class RegionalPaywallLedger {
  code: string;
  label: string;
  margin: number;
  sendAt: number;
  discount: number;
  archived: boolean;
  contactEmail: string;
  status: RegionalPaywallLedgerStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    sendAt: number,
    discount: number,
    archived: boolean,
    contactEmail: string,
    status: RegionalPaywallLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.sendAt = sendAt;
    this.discount = discount;
    this.archived = archived;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPaywallLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPaywallLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional paywall ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round((this.discount - this.sendAt) * 100) / 100;
  }

  copy(): RegionalPaywallLedger {
    return new RegionalPaywallLedger(
      this.code,
      this.label,
      this.margin,
      this.sendAt,
      this.discount,
      this.archived,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional paywall ledger in status requested. */
export function newRegionalPaywallLedger(code: string, label: string): RegionalPaywallLedger {
  return new RegionalPaywallLedger(code, label, 0, 0, 0, false, "", "requested");
}
