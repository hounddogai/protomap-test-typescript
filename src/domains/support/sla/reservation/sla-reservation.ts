/**
 * The sla reservation records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla reservation is in its life cycle. */
export type SlaReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a sla reservation and its current status. */
export class SlaReservation {
  code: string;
  name: string;
  rate: number;
  conversionRate: number;
  graceDays: number;
  locale: string;
  status: SlaReservationStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    conversionRate: number,
    graceDays: number,
    locale: string,
    status: SlaReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.graceDays = graceDays;
    this.locale = locale;
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

  canMoveTo(next: SlaReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sla reservation"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.conversionRate - this.graceDays) * 100) / 100;
  }

  copy(): SlaReservation {
    return new SlaReservation(
      this.code,
      this.name,
      this.rate,
      this.conversionRate,
      this.graceDays,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a sla reservation in status idle. */
export function newSlaReservation(code: string, name: string): SlaReservation {
  return new SlaReservation(code, name, 0, 0, 0, "", "idle");
}
