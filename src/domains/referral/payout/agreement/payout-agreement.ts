/**
 * The payout agreement records of referral's payout work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout agreement is in its life cycle. */
export type PayoutAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A payout agreement. Its code is unique within a tenant. */
export class PayoutAgreement {
  code: string;
  name: string;
  reviewer: string;
  ratio: number;
  durationMinutes: number;
  country: string;
  status: PayoutAgreementStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    ratio: number,
    durationMinutes: number,
    country: string,
    status: PayoutAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.durationMinutes - this.ratio) * 100) / 100;
  }

  copy(): PayoutAgreement {
    return new PayoutAgreement(
      this.code,
      this.name,
      this.reviewer,
      this.ratio,
      this.durationMinutes,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a payout agreement in status draft. */
export function newPayoutAgreement(code: string, name: string): PayoutAgreement {
  return new PayoutAgreement(code, name, "", 0, 0, "", "draft");
}
