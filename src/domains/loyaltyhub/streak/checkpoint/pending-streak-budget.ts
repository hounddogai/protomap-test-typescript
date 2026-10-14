import * as text from "../../../../kit/text.js";

/** Where a pending streak budget is in its life cycle. */
export type PendingStreakBudgetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending streak budget, with what the planners need to act on it. */
export class PendingStreakBudget {
  code: string;
  title: string;
  durationMinutes: number;
  country: string;
  margin: number;
  timezone: string;
  region: string;
  status: PendingStreakBudgetStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    country: string,
    margin: number,
    timezone: string,
    region: string,
    status: PendingStreakBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.country = country;
    this.margin = margin;
    this.timezone = timezone;
    this.region = region;
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

  canMoveTo(next: PendingStreakBudgetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingStreakBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending streak budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.margin + this.durationMinutes) * 100) / 100;
  }

  copy(): PendingStreakBudget {
    return new PendingStreakBudget(
      this.code,
      this.title,
      this.durationMinutes,
      this.country,
      this.margin,
      this.timezone,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending streak budget in status idle. */
export function newPendingStreakBudget(code: string, title: string): PendingStreakBudget {
  return new PendingStreakBudget(code, title, 0, "", 0, "", "", "idle");
}
