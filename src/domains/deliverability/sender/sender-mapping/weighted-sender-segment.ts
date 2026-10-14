import * as text from "../../../../kit/text.js";

/** Where a weighted sender segment is in its life cycle. */
export type WeightedSenderSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted sender segment and its current status. */
export class WeightedSenderSegment {
  code: string;
  label: string;
  frequencyCap: number;
  archived: boolean;
  durationMinutes: number;
  graceDays: number;
  cohort: string;
  priority: number;
  approved: boolean;
  status: WeightedSenderSegmentStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    archived: boolean,
    durationMinutes: number,
    graceDays: number,
    cohort: string,
    priority: number,
    approved: boolean,
    status: WeightedSenderSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.graceDays = graceDays;
    this.cohort = cohort;
    this.priority = priority;
    this.approved = approved;
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

  canMoveTo(next: WeightedSenderSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedSenderSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted sender segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted sender segment"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.priority - this.graceDays) * 100) / 100;
  }

  copy(): WeightedSenderSegment {
    return new WeightedSenderSegment(
      this.code,
      this.label,
      this.frequencyCap,
      this.archived,
      this.durationMinutes,
      this.graceDays,
      this.cohort,
      this.priority,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted sender segment in status planned. */
export function newWeightedSenderSegment(code: string, label: string): WeightedSenderSegment {
  return new WeightedSenderSegment(code, label, 0, false, 0, 0, "", 0, false, "planned");
}
