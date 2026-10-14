import * as text from "../../../../kit/text.js";

/** Where a rolling activation reservation is in its life cycle. */
export type RollingActivationReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a rolling activation reservation and its current status. */
export class RollingActivationReservation {
  code: string;
  label: string;
  floorValue: number;
  graceDays: number;
  rate: number;
  journeyId: string;
  budget: number;
  currency: string;
  frequencyCap: number;
  createdAt: number;
  conversionRate: number;
  status: RollingActivationReservationStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    graceDays: number,
    rate: number,
    journeyId: string,
    budget: number,
    currency: string,
    frequencyCap: number,
    createdAt: number,
    conversionRate: number,
    status: RollingActivationReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.graceDays = graceDays;
    this.rate = rate;
    this.journeyId = journeyId;
    this.budget = budget;
    this.currency = currency;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RollingActivationReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "failed";
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

  moveTo(next: RollingActivationReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling activation reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round((this.rate + this.frequencyCap) * 100) / 100;
  }

  copy(): RollingActivationReservation {
    return new RollingActivationReservation(
      this.code,
      this.label,
      this.floorValue,
      this.graceDays,
      this.rate,
      this.journeyId,
      this.budget,
      this.currency,
      this.frequencyCap,
      this.createdAt,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling activation reservation in status new. */
export function newRollingActivationReservation(code: string, label: string): RollingActivationReservation {
  return new RollingActivationReservation(code, label, 0, 0, 0, "", 0, "", 0, 0, 0, "new");
}
