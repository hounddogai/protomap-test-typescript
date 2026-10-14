import * as text from "../../../../kit/text.js";

/** Where a flight plan is in its life cycle. */
export type FlightPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One flight plan, with what the planners need to act on it. */
export class FlightPlan {
  code: string;
  title: string;
  ratio: number;
  durationMinutes: number;
  windowDays: number;
  status: FlightPlanStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    durationMinutes: number,
    windowDays: number,
    status: FlightPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
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

  canMoveTo(next: FlightPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
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
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netLoad(): number {
    return Math.round((this.ratio + this.durationMinutes) * 100) / 100;
  }

  copy(): FlightPlan {
    return new FlightPlan(this.code, this.title, this.ratio, this.durationMinutes, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a flight plan in status open. */
export function newFlightPlan(code: string, title: string): FlightPlan {
  return new FlightPlan(code, title, 0, 0, 0, "open");
}
