/**
 * The placement reservation records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement reservation is in its life cycle. */
export type PlacementReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A placement reservation as the placement team keeps it. */
export class PlacementReservation {
  code: string;
  label: string;
  updatedAt: number;
  active: boolean;
  amount: number;
  source: string;
  status: PlacementReservationStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    active: boolean,
    amount: number,
    source: string,
    status: PlacementReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.active = active;
    this.amount = amount;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PlacementReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.amount - this.updatedAt) * 100) / 100;
  }

  copy(): PlacementReservation {
    return new PlacementReservation(
      this.code,
      this.label,
      this.updatedAt,
      this.active,
      this.amount,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a placement reservation in status open. */
export function newPlacementReservation(code: string, label: string): PlacementReservation {
  return new PlacementReservation(code, label, 0, false, 0, "", "open");
}
