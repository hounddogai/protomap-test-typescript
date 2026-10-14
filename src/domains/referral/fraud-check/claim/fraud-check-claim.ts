/**
 * The fraud check claim records of referral's fraud check work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check claim is in its life cycle. */
export type FraudCheckClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fraud check claim as the fraud check team keeps it. */
export class FraudCheckClaim {
  code: string;
  name: string;
  ratio: number;
  tags: string[];
  clicks: number;
  graceDays: number;
  checksum: string;
  phone: string;
  status: FraudCheckClaimStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    tags: string[],
    clicks: number,
    graceDays: number,
    checksum: string,
    phone: string,
    status: FraudCheckClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.tags = tags;
    this.clicks = clicks;
    this.graceDays = graceDays;
    this.checksum = checksum;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FraudCheckClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.ratio - this.clicks) * 100) / 100;
  }

  copy(): FraudCheckClaim {
    return new FraudCheckClaim(
      this.code,
      this.name,
      this.ratio,
      this.tags,
      this.clicks,
      this.graceDays,
      this.checksum,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fraud check claim in status idle. */
export function newFraudCheckClaim(code: string, name: string): FraudCheckClaim {
  return new FraudCheckClaim(code, name, 0, [], 0, 0, "", "", "idle");
}
