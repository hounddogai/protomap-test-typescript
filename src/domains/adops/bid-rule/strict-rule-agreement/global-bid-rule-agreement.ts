/**
 * The global bid rule agreement records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global bid rule agreement is in its life cycle. */
export type GlobalBidRuleAgreementStatus = "requested" | "granted" | "revoked" | "expired";

/** A global bid rule agreement as the bid rule team keeps it. */
export class GlobalBidRuleAgreement {
  code: string;
  label: string;
  currency: string;
  openRate: number;
  updatedAt: number;
  bid: number;
  capacity: number;
  archived: boolean;
  durationMinutes: number;
  status: GlobalBidRuleAgreementStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    openRate: number,
    updatedAt: number,
    bid: number,
    capacity: number,
    archived: boolean,
    durationMinutes: number,
    status: GlobalBidRuleAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.bid = bid;
    this.capacity = capacity;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: GlobalBidRuleAgreementStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
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

  moveTo(next: GlobalBidRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global bid rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round((this.openRate + this.updatedAt) * 100) / 100;
  }

  copy(): GlobalBidRuleAgreement {
    return new GlobalBidRuleAgreement(
      this.code,
      this.label,
      this.currency,
      this.openRate,
      this.updatedAt,
      this.bid,
      this.capacity,
      this.archived,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global bid rule agreement in status requested. */
export function newGlobalBidRuleAgreement(code: string, label: string): GlobalBidRuleAgreement {
  return new GlobalBidRuleAgreement(code, label, "", 0, 0, 0, 0, false, 0, "requested");
}
