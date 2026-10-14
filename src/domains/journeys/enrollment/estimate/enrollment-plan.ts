import * as text from "../../../../kit/text.js";

/** Where a enrollment plan is in its life cycle. */
export type EnrollmentPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A enrollment plan. Its code is unique within a tenant. */
export class EnrollmentPlan {
  code: string;
  title: string;
  name: string;
  pinned: boolean;
  minimum: number;
  reviewer: string;
  campaignRef: string;
  status: EnrollmentPlanStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    pinned: boolean,
    minimum: number,
    reviewer: string,
    campaignRef: string,
    status: EnrollmentPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.pinned = pinned;
    this.minimum = minimum;
    this.reviewer = reviewer;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: EnrollmentPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: EnrollmentPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"enrollment plan"} ${this.code}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): EnrollmentPlan {
    return new EnrollmentPlan(
      this.code,
      this.title,
      this.name,
      this.pinned,
      this.minimum,
      this.reviewer,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a enrollment plan in status idle. */
export function newEnrollmentPlan(code: string, title: string): EnrollmentPlan {
  return new EnrollmentPlan(code, title, "", false, 0, "", "", "idle");
}
