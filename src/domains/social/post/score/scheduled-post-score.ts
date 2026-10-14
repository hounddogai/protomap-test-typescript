/**
 * The scheduled post score records of social's post work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled post score is in its life cycle. */
export type ScheduledPostScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled post score, with what the planners need to act on it. */
export class ScheduledPostScore {
  code: string;
  title: string;
  budget: number;
  weight: number;
  retries: number;
  durationMinutes: number;
  status: ScheduledPostScoreStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    weight: number,
    retries: number,
    durationMinutes: number,
    status: ScheduledPostScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.weight = weight;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ScheduledPostScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledPostScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled post score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled post score"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.weight - this.retries) * 100) / 100;
  }

  copy(): ScheduledPostScore {
    return new ScheduledPostScore(
      this.code,
      this.title,
      this.budget,
      this.weight,
      this.retries,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled post score in status open. */
export function newScheduledPostScore(code: string, title: string): ScheduledPostScore {
  return new ScheduledPostScore(code, title, 0, 0, 0, 0, "open");
}
