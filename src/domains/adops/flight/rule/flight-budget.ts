import * as text from "../../../../kit/text.js";

/** Where a flight budget is in its life cycle. */
export type FlightBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One flight budget, with what the planners need to act on it. */
export class FlightBudget {
  code: string;
  name: string;
  unit: string;
  category: string;
  journeyId: string;
  pinned: boolean;
  score: number;
  status: FlightBudgetStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    category: string,
    journeyId: string,
    pinned: boolean,
    score: number,
    status: FlightBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.category = category;
    this.journeyId = journeyId;
    this.pinned = pinned;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"flight budget"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): FlightBudget {
    return new FlightBudget(
      this.code,
      this.name,
      this.unit,
      this.category,
      this.journeyId,
      this.pinned,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a flight budget in status planned. */
export function newFlightBudget(code: string, name: string): FlightBudget {
  return new FlightBudget(code, name, "", "", "", false, 0, "planned");
}
