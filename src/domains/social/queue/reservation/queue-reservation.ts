/**
 * The queue reservation records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue reservation is in its life cycle. */
export type QueueReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a queue reservation and its current status. */
export class QueueReservation {
  code: string;
  label: string;
  locale: string;
  budget: number;
  currency: string;
  cost: number;
  status: QueueReservationStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    budget: number,
    currency: string,
    cost: number,
    status: QueueReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.budget = budget;
    this.currency = currency;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueReservationStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: QueueReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.cost - this.budget) * 100) / 100;
  }

  copy(): QueueReservation {
    return new QueueReservation(this.code, this.label, this.locale, this.budget, this.currency, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a queue reservation in status draft. */
export function newQueueReservation(code: string, label: string): QueueReservation {
  return new QueueReservation(code, label, "", 0, "", 0, "draft");
}
