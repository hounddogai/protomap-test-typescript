/**
 * The capped fraud check mapping records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped fraud check mapping is in its life cycle. */
export type CappedFraudCheckMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a capped fraud check mapping and its current status. */
export class CappedFraudCheckMapping {
  code: string;
  title: string;
  currency: string;
  rate: number;
  active: boolean;
  threshold: number;
  checksum: string;
  pinned: boolean;
  status: CappedFraudCheckMappingStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    rate: number,
    active: boolean,
    threshold: number,
    checksum: string,
    pinned: boolean,
    status: CappedFraudCheckMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.rate = rate;
    this.active = active;
    this.threshold = threshold;
    this.checksum = checksum;
    this.pinned = pinned;
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

  canMoveTo(next: CappedFraudCheckMappingStatus): boolean {
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

  moveTo(next: CappedFraudCheckMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped fraud check mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round(this.rate * this.threshold * 100) / 100;
  }

  copy(): CappedFraudCheckMapping {
    return new CappedFraudCheckMapping(
      this.code,
      this.title,
      this.currency,
      this.rate,
      this.active,
      this.threshold,
      this.checksum,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped fraud check mapping in status requested. */
export function newCappedFraudCheckMapping(code: string, title: string): CappedFraudCheckMapping {
  return new CappedFraudCheckMapping(code, title, "", 0, false, 0, "", false, "requested");
}
