import * as text from "../../../../kit/text.js";

/** Where a manual insight adjustment is in its life cycle. */
export type ManualInsightAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual insight adjustment, with what the planners need to act on it. */
export class ManualInsightAdjustment {
  code: string;
  title: string;
  capacity: number;
  graceDays: number;
  attempts: number;
  region: string;
  score: number;
  active: boolean;
  status: ManualInsightAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    graceDays: number,
    attempts: number,
    region: string,
    score: number,
    active: boolean,
    status: ManualInsightAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.attempts = attempts;
    this.region = region;
    this.score = score;
    this.active = active;
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

  canMoveTo(next: ManualInsightAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
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

  moveTo(next: ManualInsightAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual insight adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.score - this.capacity) * 100) / 100;
  }

  copy(): ManualInsightAdjustment {
    return new ManualInsightAdjustment(
      this.code,
      this.title,
      this.capacity,
      this.graceDays,
      this.attempts,
      this.region,
      this.score,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a manual insight adjustment in status open. */
export function newManualInsightAdjustment(code: string, title: string): ManualInsightAdjustment {
  return new ManualInsightAdjustment(code, title, 0, 0, 0, "", 0, false, "open");
}
