import * as text from "../../../../kit/text.js";

/** Where a legacy streak threshold is in its life cycle. */
export type LegacyStreakThresholdStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy streak threshold and its current status. */
export class LegacyStreakThreshold {
  code: string;
  label: string;
  name: string;
  retries: number;
  budget: number;
  status: LegacyStreakThresholdStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    retries: number,
    budget: number,
    status: LegacyStreakThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.retries = retries;
    this.budget = budget;
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

  canMoveTo(next: LegacyStreakThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: LegacyStreakThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy streak threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy streak threshold"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget + this.retries) * 100) / 100;
  }

  copy(): LegacyStreakThreshold {
    return new LegacyStreakThreshold(this.code, this.label, this.name, this.retries, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy streak threshold in status created. */
export function newLegacyStreakThreshold(code: string, label: string): LegacyStreakThreshold {
  return new LegacyStreakThreshold(code, label, "", 0, 0, "created");
}
