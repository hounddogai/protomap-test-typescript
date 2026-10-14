/**
 * The payout override records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout override is in its life cycle. */
export type PayoutOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A payout override as the payout team keeps it. */
export class PayoutOverride {
  code: string;
  name: string;
  region: string;
  phone: string;
  archived: boolean;
  startsAt: number;
  updatedAt: number;
  journeyId: string;
  status: PayoutOverrideStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    phone: string,
    archived: boolean,
    startsAt: number,
    updatedAt: number,
    journeyId: string,
    status: PayoutOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.phone = phone;
    this.archived = archived;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
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

  canMoveTo(next: PayoutOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PayoutOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"payout override"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.startsAt * this.updatedAt * 100) / 100;
  }

  copy(): PayoutOverride {
    return new PayoutOverride(
      this.code,
      this.name,
      this.region,
      this.phone,
      this.archived,
      this.startsAt,
      this.updatedAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a payout override in status requested. */
export function newPayoutOverride(code: string, name: string): PayoutOverride {
  return new PayoutOverride(code, name, "", "", false, 0, 0, "", "requested");
}
