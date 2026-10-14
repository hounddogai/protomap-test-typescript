import * as text from "../../../../kit/text.js";

/** Where a strict reward threshold is in its life cycle. */
export type StrictRewardThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One strict reward threshold, with what the planners need to act on it. */
export class StrictRewardThreshold {
  code: string;
  label: string;
  approved: boolean;
  cohort: string;
  timezone: string;
  archived: boolean;
  reviewer: string;
  unit: string;
  amount: number;
  status: StrictRewardThresholdStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    cohort: string,
    timezone: string,
    archived: boolean,
    reviewer: string,
    unit: string,
    amount: number,
    status: StrictRewardThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.cohort = cohort;
    this.timezone = timezone;
    this.archived = archived;
    this.reviewer = reviewer;
    this.unit = unit;
    this.amount = amount;
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

  canMoveTo(next: StrictRewardThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictRewardThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reward threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StrictRewardThreshold {
    return new StrictRewardThreshold(
      this.code,
      this.label,
      this.approved,
      this.cohort,
      this.timezone,
      this.archived,
      this.reviewer,
      this.unit,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict reward threshold in status idle. */
export function newStrictRewardThreshold(code: string, label: string): StrictRewardThreshold {
  return new StrictRewardThreshold(code, label, false, "", "", false, "", "", 0, "idle");
}
