/**
 * The redemption exception records of loyaltyhub's redemption work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a redemption exception is in its life cycle. */
export type RedemptionExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A redemption exception. Its code is unique within a tenant. */
export class RedemptionException {
  code: string;
  title: string;
  source: string;
  visible: boolean;
  ownerId: string;
  version: number;
  timezone: string;
  windowDays: number;
  approved: boolean;
  discount: number;
  unit: string;
  status: RedemptionExceptionStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    visible: boolean,
    ownerId: string,
    version: number,
    timezone: string,
    windowDays: number,
    approved: boolean,
    discount: number,
    unit: string,
    status: RedemptionExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.visible = visible;
    this.ownerId = ownerId;
    this.version = version;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.approved = approved;
    this.discount = discount;
    this.unit = unit;
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

  canMoveTo(next: RedemptionExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round((this.version + this.discount) * 100) / 100;
  }

  copy(): RedemptionException {
    return new RedemptionException(
      this.code,
      this.title,
      this.source,
      this.visible,
      this.ownerId,
      this.version,
      this.timezone,
      this.windowDays,
      this.approved,
      this.discount,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a redemption exception in status requested. */
export function newRedemptionException(code: string, title: string): RedemptionException {
  return new RedemptionException(code, title, "", false, "", 0, "", 0, false, 0, "", "requested");
}
