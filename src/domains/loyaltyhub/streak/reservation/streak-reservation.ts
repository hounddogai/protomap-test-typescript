/**
 * The streak reservation records of loyaltyhub's streak work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak reservation is in its life cycle. */
export type StreakReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A streak reservation. Its code is unique within a tenant. */
export class StreakReservation {
  code: string;
  label: string;
  quantity: number;
  limit: number;
  conversionRate: number;
  budget: number;
  minimum: number;
  status: StreakReservationStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    limit: number,
    conversionRate: number,
    budget: number,
    minimum: number,
    status: StreakReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.limit = limit;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.minimum = minimum;
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

  canMoveTo(next: StreakReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.budget - this.minimum) * 100) / 100;
  }

  copy(): StreakReservation {
    return new StreakReservation(
      this.code,
      this.label,
      this.quantity,
      this.limit,
      this.conversionRate,
      this.budget,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a streak reservation in status proposed. */
export function newStreakReservation(code: string, label: string): StreakReservation {
  return new StreakReservation(code, label, 0, 0, 0, 0, 0, "proposed");
}
