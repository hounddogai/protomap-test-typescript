import * as text from "../../../../kit/text.js";

/** Where a legacy flight reservation is in its life cycle. */
export type LegacyFlightReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy flight reservation as the flight team keeps it. */
export class LegacyFlightReservation {
  code: string;
  label: string;
  floorValue: number;
  graceDays: number;
  expiresAt: number;
  priority: number;
  frequencyCap: number;
  unit: string;
  status: LegacyFlightReservationStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    graceDays: number,
    expiresAt: number,
    priority: number,
    frequencyCap: number,
    unit: string,
    status: LegacyFlightReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.unit = unit;
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

  canMoveTo(next: LegacyFlightReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFlightReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy flight reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round((this.expiresAt - this.floorValue) * 100) / 100;
  }

  copy(): LegacyFlightReservation {
    return new LegacyFlightReservation(
      this.code,
      this.label,
      this.floorValue,
      this.graceDays,
      this.expiresAt,
      this.priority,
      this.frequencyCap,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a legacy flight reservation in status idle. */
export function newLegacyFlightReservation(code: string, label: string): LegacyFlightReservation {
  return new LegacyFlightReservation(code, label, 0, 0, 0, 0, 0, "", "idle");
}
