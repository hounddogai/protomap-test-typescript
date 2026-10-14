import * as text from "../../../../kit/text.js";

/** Where a primary redemption exception is in its life cycle. */
export type PrimaryRedemptionExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary redemption exception and its current status. */
export class PrimaryRedemptionException {
  code: string;
  name: string;
  rate: number;
  updatedAt: number;
  bid: number;
  status: PrimaryRedemptionExceptionStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    updatedAt: number,
    bid: number,
    status: PrimaryRedemptionExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.updatedAt = updatedAt;
    this.bid = bid;
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

  canMoveTo(next: PrimaryRedemptionExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
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

  moveTo(next: PrimaryRedemptionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary redemption exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary redemption exception"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.updatedAt - this.rate) * 100) / 100;
  }

  copy(): PrimaryRedemptionException {
    return new PrimaryRedemptionException(this.code, this.name, this.rate, this.updatedAt, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary redemption exception in status requested. */
export function newPrimaryRedemptionException(code: string, name: string): PrimaryRedemptionException {
  return new PrimaryRedemptionException(code, name, 0, 0, 0, "requested");
}
