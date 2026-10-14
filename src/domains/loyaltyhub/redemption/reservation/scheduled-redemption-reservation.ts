/**
 * The scheduled redemption reservation records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled redemption reservation is in its life cycle. */
export type ScheduledRedemptionReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled redemption reservation. Its code is unique within a tenant. */
export class ScheduledRedemptionReservation {
  code: string;
  name: string;
  country: string;
  unit: string;
  budget: number;
  summary: string;
  maximum: number;
  phone: string;
  status: ScheduledRedemptionReservationStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    unit: string,
    budget: number,
    summary: string,
    maximum: number,
    phone: string,
    status: ScheduledRedemptionReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.unit = unit;
    this.budget = budget;
    this.summary = summary;
    this.maximum = maximum;
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

  canMoveTo(next: ScheduledRedemptionReservationStatus): boolean {
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

  moveTo(next: ScheduledRedemptionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled redemption reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled redemption reservation"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.budget * this.maximum * 100) / 100;
  }

  copy(): ScheduledRedemptionReservation {
    return new ScheduledRedemptionReservation(
      this.code,
      this.name,
      this.country,
      this.unit,
      this.budget,
      this.summary,
      this.maximum,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a scheduled redemption reservation in status idle. */
export function newScheduledRedemptionReservation(code: string, name: string): ScheduledRedemptionReservation {
  return new ScheduledRedemptionReservation(code, name, "", "", 0, "", 0, "", "idle");
}
