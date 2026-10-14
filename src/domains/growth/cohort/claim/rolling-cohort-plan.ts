import * as text from "../../../../kit/text.js";

/** Where a rolling cohort plan is in its life cycle. */
export type RollingCohortPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling cohort plan as the cohort team keeps it. */
export class RollingCohortPlan {
  code: string;
  label: string;
  frequencyCap: number;
  bid: number;
  sequence: number;
  priority: number;
  status: RollingCohortPlanStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    bid: number,
    sequence: number,
    priority: number,
    status: RollingCohortPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
    this.sequence = sequence;
    this.priority = priority;
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

  canMoveTo(next: RollingCohortPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
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

  moveTo(next: RollingCohortPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling cohort plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.sequence + this.priority) * 100) / 100;
  }

  copy(): RollingCohortPlan {
    return new RollingCohortPlan(
      this.code,
      this.label,
      this.frequencyCap,
      this.bid,
      this.sequence,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling cohort plan in status open. */
export function newRollingCohortPlan(code: string, label: string): RollingCohortPlan {
  return new RollingCohortPlan(code, label, 0, 0, 0, 0, "open");
}
