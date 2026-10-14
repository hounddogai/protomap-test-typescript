import * as text from "../../../../kit/text.js";

/** Where a reward window is in its life cycle. */
export type RewardWindowStatus = "created" | "validated" | "published" | "retired";

/** A reward window. Its code is unique within a tenant. */
export class RewardWindow {
  code: string;
  title: string;
  minimum: number;
  name: string;
  threshold: number;
  cohort: string;
  status: RewardWindowStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    name: string,
    threshold: number,
    cohort: string,
    status: RewardWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.name = name;
    this.threshold = threshold;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.threshold * this.minimum * 100) / 100;
  }

  copy(): RewardWindow {
    return new RewardWindow(this.code, this.title, this.minimum, this.name, this.threshold, this.cohort, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward window in status created. */
export function newRewardWindow(code: string, title: string): RewardWindow {
  return new RewardWindow(code, title, 0, "", 0, "", "created");
}
