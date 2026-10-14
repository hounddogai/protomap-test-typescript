import * as text from "../../../../kit/text.js";

/** Where a streak plan is in its life cycle. */
export type StreakPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a streak plan and its current status. */
export class StreakPlan {
  code: string;
  title: string;
  source: string;
  threshold: number;
  clicks: number;
  description: string;
  amount: number;
  priority: number;
  name: string;
  attempts: number;
  status: StreakPlanStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    threshold: number,
    clicks: number,
    description: string,
    amount: number,
    priority: number,
    name: string,
    attempts: number,
    status: StreakPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.threshold = threshold;
    this.clicks = clicks;
    this.description = description;
    this.amount = amount;
    this.priority = priority;
    this.name = name;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StreakPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round(this.threshold * this.priority * 100) / 100;
  }

  copy(): StreakPlan {
    return new StreakPlan(
      this.code,
      this.title,
      this.source,
      this.threshold,
      this.clicks,
      this.description,
      this.amount,
      this.priority,
      this.name,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a streak plan in status proposed. */
export function newStreakPlan(code: string, title: string): StreakPlan {
  return new StreakPlan(code, title, "", 0, 0, "", 0, 0, "", 0, "proposed");
}
