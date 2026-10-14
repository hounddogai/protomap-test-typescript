/**
 * The primary redemption variance records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary redemption variance is in its life cycle. */
export type PrimaryRedemptionVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary redemption variance as the redemption team keeps it. */
export class PrimaryRedemptionVariance {
  code: string;
  name: string;
  locale: string;
  capacity: number;
  batchSize: number;
  description: string;
  maximum: number;
  amount: number;
  status: PrimaryRedemptionVarianceStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    capacity: number,
    batchSize: number,
    description: string,
    maximum: number,
    amount: number,
    status: PrimaryRedemptionVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.capacity = capacity;
    this.batchSize = batchSize;
    this.description = description;
    this.maximum = maximum;
    this.amount = amount;
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

  canMoveTo(next: PrimaryRedemptionVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryRedemptionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary redemption variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary redemption variance"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.batchSize - this.maximum) * 100) / 100;
  }

  copy(): PrimaryRedemptionVariance {
    return new PrimaryRedemptionVariance(
      this.code,
      this.name,
      this.locale,
      this.capacity,
      this.batchSize,
      this.description,
      this.maximum,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary redemption variance in status requested. */
export function newPrimaryRedemptionVariance(code: string, name: string): PrimaryRedemptionVariance {
  return new PrimaryRedemptionVariance(code, name, "", 0, 0, "", 0, 0, "requested");
}
