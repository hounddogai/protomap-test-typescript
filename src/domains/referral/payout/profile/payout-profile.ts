/**
 * The payout profile records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout profile is in its life cycle. */
export type PayoutProfileStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A payout profile as the payout team keeps it. */
export class PayoutProfile {
  code: string;
  name: string;
  audienceId: string;
  utmSource: string;
  locale: string;
  timezone: string;
  conversionRate: number;
  status: PayoutProfileStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    utmSource: string,
    locale: string,
    timezone: string,
    conversionRate: number,
    status: PayoutProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.utmSource = utmSource;
    this.locale = locale;
    this.timezone = timezone;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutProfileStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): PayoutProfile {
    return new PayoutProfile(
      this.code,
      this.name,
      this.audienceId,
      this.utmSource,
      this.locale,
      this.timezone,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a payout profile in status proposed. */
export function newPayoutProfile(code: string, name: string): PayoutProfile {
  return new PayoutProfile(code, name, "", "", "", "", 0, "proposed");
}
