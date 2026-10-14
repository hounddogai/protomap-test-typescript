/**
 * The lenient redemption tier records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient redemption tier is in its life cycle. */
export type LenientRedemptionTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient redemption tier and its current status. */
export class LenientRedemptionTier {
  code: string;
  name: string;
  currency: string;
  channel: string;
  startsAt: number;
  status: LenientRedemptionTierStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    channel: string,
    startsAt: number,
    status: LenientRedemptionTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.channel = channel;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientRedemptionTierStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientRedemptionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient redemption tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): LenientRedemptionTier {
    return new LenientRedemptionTier(this.code, this.name, this.currency, this.channel, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient redemption tier in status new. */
export function newLenientRedemptionTier(code: string, name: string): LenientRedemptionTier {
  return new LenientRedemptionTier(code, name, "", "", 0, "new");
}
