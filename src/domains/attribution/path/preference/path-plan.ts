import * as text from "../../../../kit/text.js";

/** Where a path plan is in its life cycle. */
export type PathPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a path plan and its current status. */
export class PathPlan {
  code: string;
  title: string;
  budget: number;
  updatedAt: number;
  rate: number;
  externalRef: string;
  status: PathPlanStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    updatedAt: number,
    rate: number,
    externalRef: string,
    status: PathPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.rate = rate;
    this.externalRef = externalRef;
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

  canMoveTo(next: PathPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PathPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.rate + this.budget) * 100) / 100;
  }

  copy(): PathPlan {
    return new PathPlan(this.code, this.title, this.budget, this.updatedAt, this.rate, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path plan in status planned. */
export function newPathPlan(code: string, title: string): PathPlan {
  return new PathPlan(code, title, 0, 0, 0, "", "planned");
}
