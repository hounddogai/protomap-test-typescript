import * as text from "../../../../kit/text.js";

/** Where a weighted preference threshold is in its life cycle. */
export type WeightedPreferenceThresholdStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One weighted preference threshold, with what the planners need to act on it. */
export class WeightedPreferenceThreshold {
  code: string;
  label: string;
  priority: number;
  clicks: number;
  expiresAt: number;
  startsAt: number;
  cohort: string;
  status: WeightedPreferenceThresholdStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    clicks: number,
    expiresAt: number,
    startsAt: number,
    cohort: string,
    status: WeightedPreferenceThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedPreferenceThresholdStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedPreferenceThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted preference threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedExposure(): number {
    return Math.round((this.expiresAt - this.clicks) * 100) / 100;
  }

  copy(): WeightedPreferenceThreshold {
    return new WeightedPreferenceThreshold(
      this.code,
      this.label,
      this.priority,
      this.clicks,
      this.expiresAt,
      this.startsAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted preference threshold in status planned. */
export function newWeightedPreferenceThreshold(code: string, label: string): WeightedPreferenceThreshold {
  return new WeightedPreferenceThreshold(code, label, 0, 0, 0, 0, "", "planned");
}
