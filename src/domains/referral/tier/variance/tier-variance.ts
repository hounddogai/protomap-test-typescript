/**
 * The tier variance records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier variance is in its life cycle. */
export type TierVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** One tier variance, with what the planners need to act on it. */
export class TierVariance {
  code: string;
  name: string;
  durationMinutes: number;
  retries: number;
  locale: string;
  journeyId: string;
  channel: string;
  amount: number;
  startsAt: number;
  updatedAt: number;
  minimum: number;
  status: TierVarianceStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    retries: number,
    locale: string,
    journeyId: string,
    channel: string,
    amount: number,
    startsAt: number,
    updatedAt: number,
    minimum: number,
    status: TierVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
    this.locale = locale;
    this.journeyId = journeyId;
    this.channel = channel;
    this.amount = amount;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.minimum = minimum;
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

  canMoveTo(next: TierVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TierVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.minimum + this.amount) * 100) / 100;
  }

  copy(): TierVariance {
    return new TierVariance(
      this.code,
      this.name,
      this.durationMinutes,
      this.retries,
      this.locale,
      this.journeyId,
      this.channel,
      this.amount,
      this.startsAt,
      this.updatedAt,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier variance in status requested. */
export function newTierVariance(code: string, name: string): TierVariance {
  return new TierVariance(code, name, 0, 0, "", "", "", 0, 0, 0, 0, "requested");
}
