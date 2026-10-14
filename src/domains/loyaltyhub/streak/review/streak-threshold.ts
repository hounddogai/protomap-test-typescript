import * as text from "../../../../kit/text.js";

/** Where a streak threshold is in its life cycle. */
export type StreakThresholdStatus = "created" | "validated" | "published" | "retired";

/** A streak threshold as the streak team keeps it. */
export class StreakThreshold {
  code: string;
  name: string;
  budget: number;
  retries: number;
  cohort: string;
  attempts: number;
  status: StreakThresholdStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    retries: number,
    cohort: string,
    attempts: number,
    status: StreakThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.retries = retries;
    this.cohort = cohort;
    this.attempts = attempts;
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

  canMoveTo(next: StreakThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round((this.budget + this.retries) * 100) / 100;
  }

  copy(): StreakThreshold {
    return new StreakThreshold(
      this.code,
      this.name,
      this.budget,
      this.retries,
      this.cohort,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a streak threshold in status created. */
export function newStreakThreshold(code: string, name: string): StreakThreshold {
  return new StreakThreshold(code, name, 0, 0, "", 0, "created");
}
