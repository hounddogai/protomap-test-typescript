/**
 * The scheduled queue estimate records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled queue estimate is in its life cycle. */
export type ScheduledQueueEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One scheduled queue estimate, with what the planners need to act on it. */
export class ScheduledQueueEstimate {
  code: string;
  name: string;
  notes: string;
  score: number;
  ratio: number;
  status: ScheduledQueueEstimateStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    score: number,
    ratio: number,
    status: ScheduledQueueEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.score = score;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledQueueEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ScheduledQueueEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled queue estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.score - this.ratio) * 100) / 100;
  }

  copy(): ScheduledQueueEstimate {
    return new ScheduledQueueEstimate(this.code, this.name, this.notes, this.score, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled queue estimate in status draft. */
export function newScheduledQueueEstimate(code: string, name: string): ScheduledQueueEstimate {
  return new ScheduledQueueEstimate(code, name, "", 0, 0, "draft");
}
