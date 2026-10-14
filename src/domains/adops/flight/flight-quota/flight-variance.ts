import * as text from "../../../../kit/text.js";

/** Where a flight variance is in its life cycle. */
export type FlightVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A flight variance. Its code is unique within a tenant. */
export class FlightVariance {
  code: string;
  label: string;
  priority: number;
  category: string;
  discount: number;
  status: FlightVarianceStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    category: string,
    discount: number,
    status: FlightVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.category = category;
    this.discount = discount;
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

  canMoveTo(next: FlightVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round(this.priority * this.discount * 100) / 100;
  }

  copy(): FlightVariance {
    return new FlightVariance(this.code, this.label, this.priority, this.category, this.discount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a flight variance in status open. */
export function newFlightVariance(code: string, label: string): FlightVariance {
  return new FlightVariance(code, label, 0, "", 0, "open");
}
