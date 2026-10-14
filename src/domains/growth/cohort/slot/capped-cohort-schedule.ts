import * as text from "../../../../kit/text.js";

/** Where a capped cohort schedule is in its life cycle. */
export type CappedCohortScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped cohort schedule. Its code is unique within a tenant. */
export class CappedCohortSchedule {
  code: string;
  name: string;
  cohort: string;
  currency: string;
  budget: number;
  unit: string;
  status: CappedCohortScheduleStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    currency: string,
    budget: number,
    unit: string,
    status: CappedCohortScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.currency = currency;
    this.budget = budget;
    this.unit = unit;
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

  canMoveTo(next: CappedCohortScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
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

  moveTo(next: CappedCohortScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped cohort schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): CappedCohortSchedule {
    return new CappedCohortSchedule(
      this.code,
      this.name,
      this.cohort,
      this.currency,
      this.budget,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped cohort schedule in status open. */
export function newCappedCohortSchedule(code: string, name: string): CappedCohortSchedule {
  return new CappedCohortSchedule(code, name, "", "", 0, "", "open");
}
