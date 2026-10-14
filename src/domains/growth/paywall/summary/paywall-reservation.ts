import * as text from "../../../../kit/text.js";

/** Where a paywall reservation is in its life cycle. */
export type PaywallReservationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A paywall reservation. Its code is unique within a tenant. */
export class PaywallReservation {
  code: string;
  name: string;
  title: string;
  frequencyCap: number;
  discount: number;
  budget: number;
  graceDays: number;
  status: PaywallReservationStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    frequencyCap: number,
    discount: number,
    budget: number,
    graceDays: number,
    status: PaywallReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.discount = discount;
    this.budget = budget;
    this.graceDays = graceDays;
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

  canMoveTo(next: PaywallReservationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PaywallReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays - this.frequencyCap) * 100) / 100;
  }

  copy(): PaywallReservation {
    return new PaywallReservation(
      this.code,
      this.name,
      this.title,
      this.frequencyCap,
      this.discount,
      this.budget,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a paywall reservation in status open. */
export function newPaywallReservation(code: string, name: string): PaywallReservation {
  return new PaywallReservation(code, name, "", 0, 0, 0, 0, "open");
}
