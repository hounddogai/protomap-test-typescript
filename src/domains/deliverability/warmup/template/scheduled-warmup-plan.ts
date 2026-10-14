import * as text from "../../../../kit/text.js";

/** Where a scheduled warmup plan is in its life cycle. */
export type ScheduledWarmupPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a scheduled warmup plan and its current status. */
export class ScheduledWarmupPlan {
  code: string;
  title: string;
  budget: number;
  rate: number;
  priority: number;
  windowDays: number;
  createdAt: number;
  contactEmail: string;
  updatedAt: number;
  score: number;
  status: ScheduledWarmupPlanStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    rate: number,
    priority: number,
    windowDays: number,
    createdAt: number,
    contactEmail: string,
    updatedAt: number,
    score: number,
    status: ScheduledWarmupPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.rate = rate;
    this.priority = priority;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.updatedAt = updatedAt;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledWarmupPlanStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledWarmupPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled warmup plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled warmup plan"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.score * this.updatedAt * 100) / 100;
  }

  copy(): ScheduledWarmupPlan {
    return new ScheduledWarmupPlan(
      this.code,
      this.title,
      this.budget,
      this.rate,
      this.priority,
      this.windowDays,
      this.createdAt,
      this.contactEmail,
      this.updatedAt,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled warmup plan in status new. */
export function newScheduledWarmupPlan(code: string, title: string): ScheduledWarmupPlan {
  return new ScheduledWarmupPlan(code, title, 0, 0, 0, 0, 0, "", 0, 0, "new");
}
