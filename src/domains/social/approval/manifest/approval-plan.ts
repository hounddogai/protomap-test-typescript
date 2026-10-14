import * as text from "../../../../kit/text.js";

/** Where a approval plan is in its life cycle. */
export type ApprovalPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a approval plan and its current status. */
export class ApprovalPlan {
  code: string;
  title: string;
  version: number;
  timezone: string;
  cost: number;
  cohort: string;
  status: ApprovalPlanStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    timezone: string,
    cost: number,
    cohort: string,
    status: ApprovalPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.timezone = timezone;
    this.cost = cost;
    this.cohort = cohort;
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

  canMoveTo(next: ApprovalPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.cost - this.version) * 100) / 100;
  }

  copy(): ApprovalPlan {
    return new ApprovalPlan(this.code, this.title, this.version, this.timezone, this.cost, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a approval plan in status idle. */
export function newApprovalPlan(code: string, title: string): ApprovalPlan {
  return new ApprovalPlan(code, title, 0, "", 0, "", "idle");
}
