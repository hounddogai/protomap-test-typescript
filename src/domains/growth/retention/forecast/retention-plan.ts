import * as text from "../../../../kit/text.js";

/** Where a retention plan is in its life cycle. */
export type RetentionPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A retention plan. Its code is unique within a tenant. */
export class RetentionPlan {
  code: string;
  title: string;
  conversionRate: number;
  timezone: string;
  startsAt: number;
  status: RetentionPlanStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    timezone: string,
    startsAt: number,
    status: RetentionPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.timezone = timezone;
    this.startsAt = startsAt;
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

  canMoveTo(next: RetentionPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"retention plan"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.conversionRate * this.startsAt * 100) / 100;
  }

  copy(): RetentionPlan {
    return new RetentionPlan(this.code, this.title, this.conversionRate, this.timezone, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention plan in status open. */
export function newRetentionPlan(code: string, title: string): RetentionPlan {
  return new RetentionPlan(code, title, 0, "", 0, "open");
}
