/**
 * The suppression reservation records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression reservation is in its life cycle. */
export type SuppressionReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A suppression reservation. Its code is unique within a tenant. */
export class SuppressionReservation {
  code: string;
  label: string;
  quantity: number;
  discount: number;
  limit: number;
  sequence: number;
  updatedAt: number;
  budget: number;
  status: SuppressionReservationStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    discount: number,
    limit: number,
    sequence: number,
    updatedAt: number,
    budget: number,
    status: SuppressionReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.discount = discount;
    this.limit = limit;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.budget = budget;
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

  canMoveTo(next: SuppressionReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SuppressionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"suppression reservation"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.updatedAt - this.quantity) * 100) / 100;
  }

  copy(): SuppressionReservation {
    return new SuppressionReservation(
      this.code,
      this.label,
      this.quantity,
      this.discount,
      this.limit,
      this.sequence,
      this.updatedAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression reservation in status idle. */
export function newSuppressionReservation(code: string, label: string): SuppressionReservation {
  return new SuppressionReservation(code, label, 0, 0, 0, 0, 0, 0, "idle");
}
