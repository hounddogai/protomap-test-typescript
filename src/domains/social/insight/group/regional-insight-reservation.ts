import * as text from "../../../../kit/text.js";

/** Where a regional insight reservation is in its life cycle. */
export type RegionalInsightReservationStatus = "created" | "validated" | "published" | "retired";

/** A regional insight reservation as the insight team keeps it. */
export class RegionalInsightReservation {
  code: string;
  name: string;
  budget: number;
  segment: string;
  amount: number;
  status: RegionalInsightReservationStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    segment: string,
    amount: number,
    status: RegionalInsightReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.segment = segment;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalInsightReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalInsightReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional insight reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.amount + this.budget) * 100) / 100;
  }

  copy(): RegionalInsightReservation {
    return new RegionalInsightReservation(this.code, this.name, this.budget, this.segment, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a regional insight reservation in status created. */
export function newRegionalInsightReservation(code: string, name: string): RegionalInsightReservation {
  return new RegionalInsightReservation(code, name, 0, "", 0, "created");
}
