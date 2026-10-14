import * as text from "../../../../kit/text.js";

/** Where a cohort plan is in its life cycle. */
export type CohortPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A cohort plan as the cohort team keeps it. */
export class CohortPlan {
  code: string;
  name: string;
  windowDays: number;
  source: string;
  conversionRate: number;
  status: CohortPlanStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    source: string,
    conversionRate: number,
    status: CohortPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.source = source;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.windowDays * this.conversionRate * 100) / 100;
  }

  copy(): CohortPlan {
    return new CohortPlan(this.code, this.name, this.windowDays, this.source, this.conversionRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a cohort plan in status requested. */
export function newCohortPlan(code: string, name: string): CohortPlan {
  return new CohortPlan(code, name, 0, "", 0, "requested");
}
