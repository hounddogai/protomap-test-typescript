/**
 * The adaptive escalation reservation records of support's escalation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive escalation reservation is in its life cycle. */
export type AdaptiveEscalationReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive escalation reservation as the escalation team keeps it. */
export class AdaptiveEscalationReservation {
  code: string;
  title: string;
  frequencyCap: number;
  expiresAt: number;
  currency: string;
  country: string;
  segment: string;
  floorValue: number;
  windowDays: number;
  amount: number;
  status: AdaptiveEscalationReservationStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    expiresAt: number,
    currency: string,
    country: string,
    segment: string,
    floorValue: number,
    windowDays: number,
    amount: number,
    status: AdaptiveEscalationReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.country = country;
    this.segment = segment;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.amount = amount;
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

  canMoveTo(next: AdaptiveEscalationReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptiveEscalationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive escalation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive escalation reservation"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.amount * this.expiresAt * 100) / 100;
  }

  copy(): AdaptiveEscalationReservation {
    return new AdaptiveEscalationReservation(
      this.code,
      this.title,
      this.frequencyCap,
      this.expiresAt,
      this.currency,
      this.country,
      this.segment,
      this.floorValue,
      this.windowDays,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive escalation reservation in status new. */
export function newAdaptiveEscalationReservation(code: string, title: string): AdaptiveEscalationReservation {
  return new AdaptiveEscalationReservation(code, title, 0, 0, "", "", "", 0, 0, 0, "new");
}
