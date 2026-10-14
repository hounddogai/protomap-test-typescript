import * as text from "../../../../kit/text.js";

/** Where a strict cohort plan is in its life cycle. */
export type StrictCohortPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict cohort plan. Its code is unique within a tenant. */
export class StrictCohortPlan {
  code: string;
  name: string;
  weight: number;
  locale: string;
  version: number;
  status: StrictCohortPlanStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    locale: string,
    version: number,
    status: StrictCohortPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.locale = locale;
    this.version = version;
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

  canMoveTo(next: StrictCohortPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictCohortPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict cohort plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"strict cohort plan"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.weight - this.version) * 100) / 100;
  }

  copy(): StrictCohortPlan {
    return new StrictCohortPlan(this.code, this.name, this.weight, this.locale, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict cohort plan in status idle. */
export function newStrictCohortPlan(code: string, name: string): StrictCohortPlan {
  return new StrictCohortPlan(code, name, 0, "", 0, "idle");
}
