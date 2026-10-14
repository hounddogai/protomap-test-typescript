/**
 * The legacy payout reservation records of referral's payout work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy payout reservation is in its life cycle. */
export type LegacyPayoutReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a legacy payout reservation and its current status. */
export class LegacyPayoutReservation {
  code: string;
  label: string;
  conversionRate: number;
  name: string;
  region: string;
  status: LegacyPayoutReservationStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    name: string,
    region: string,
    status: LegacyPayoutReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.name = name;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyPayoutReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPayoutReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy payout reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): LegacyPayoutReservation {
    return new LegacyPayoutReservation(this.code, this.label, this.conversionRate, this.name, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy payout reservation in status planned. */
export function newLegacyPayoutReservation(code: string, label: string): LegacyPayoutReservation {
  return new LegacyPayoutReservation(code, label, 0, "", "", "planned");
}
