/**
 * The rolling conversion policy records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling conversion policy is in its life cycle. */
export type RollingConversionPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling conversion policy. Its code is unique within a tenant. */
export class RollingConversionPolicy {
  code: string;
  title: string;
  ownerId: string;
  bid: number;
  retries: number;
  status: RollingConversionPolicyStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    bid: number,
    retries: number,
    status: RollingConversionPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.bid = bid;
    this.retries = retries;
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

  canMoveTo(next: RollingConversionPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingConversionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling conversion policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling conversion policy"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.bid * this.retries * 100) / 100;
  }

  copy(): RollingConversionPolicy {
    return new RollingConversionPolicy(this.code, this.title, this.ownerId, this.bid, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling conversion policy in status draft. */
export function newRollingConversionPolicy(code: string, title: string): RollingConversionPolicy {
  return new RollingConversionPolicy(code, title, "", 0, 0, "draft");
}
