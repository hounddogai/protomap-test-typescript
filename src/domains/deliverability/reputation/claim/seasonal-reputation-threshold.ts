import * as text from "../../../../kit/text.js";

/** Where a seasonal reputation threshold is in its life cycle. */
export type SeasonalReputationThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One seasonal reputation threshold, with what the planners need to act on it. */
export class SeasonalReputationThreshold {
  code: string;
  label: string;
  budget: number;
  capacity: number;
  graceDays: number;
  title: string;
  status: SeasonalReputationThresholdStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    capacity: number,
    graceDays: number,
    title: string,
    status: SeasonalReputationThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.title = title;
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

  canMoveTo(next: SeasonalReputationThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalReputationThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reputation threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round((this.budget + this.graceDays) * 100) / 100;
  }

  copy(): SeasonalReputationThreshold {
    return new SeasonalReputationThreshold(
      this.code,
      this.label,
      this.budget,
      this.capacity,
      this.graceDays,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal reputation threshold in status proposed. */
export function newSeasonalReputationThreshold(code: string, label: string): SeasonalReputationThreshold {
  return new SeasonalReputationThreshold(code, label, 0, 0, 0, "", "proposed");
}
