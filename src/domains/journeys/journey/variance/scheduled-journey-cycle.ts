import * as text from "../../../../kit/text.js";

/** Where a scheduled journey cycle is in its life cycle. */
export type ScheduledJourneyCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One scheduled journey cycle, with what the planners need to act on it. */
export class ScheduledJourneyCycle {
  code: string;
  label: string;
  floorValue: number;
  cohort: string;
  windowDays: number;
  ratio: number;
  weight: number;
  status: ScheduledJourneyCycleStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    cohort: string,
    windowDays: number,
    ratio: number,
    weight: number,
    status: ScheduledJourneyCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.cohort = cohort;
    this.windowDays = windowDays;
    this.ratio = ratio;
    this.weight = weight;
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

  canMoveTo(next: ScheduledJourneyCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledJourneyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled journey cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.floorValue + this.weight) * 100) / 100;
  }

  copy(): ScheduledJourneyCycle {
    return new ScheduledJourneyCycle(
      this.code,
      this.label,
      this.floorValue,
      this.cohort,
      this.windowDays,
      this.ratio,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled journey cycle in status planned. */
export function newScheduledJourneyCycle(code: string, label: string): ScheduledJourneyCycle {
  return new ScheduledJourneyCycle(code, label, 0, "", 0, 0, 0, "planned");
}
