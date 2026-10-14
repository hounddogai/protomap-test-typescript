import * as text from "../../../../kit/text.js";

/** Where a weighted enrollment cycle is in its life cycle. */
export type WeightedEnrollmentCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted enrollment cycle and its current status. */
export class WeightedEnrollmentCycle {
  code: string;
  label: string;
  contactEmail: string;
  checksum: string;
  notes: string;
  journeyId: string;
  minimum: number;
  impressions: number;
  status: WeightedEnrollmentCycleStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    checksum: string,
    notes: string,
    journeyId: string,
    minimum: number,
    impressions: number,
    status: WeightedEnrollmentCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.notes = notes;
    this.journeyId = journeyId;
    this.minimum = minimum;
    this.impressions = impressions;
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

  canMoveTo(next: WeightedEnrollmentCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedEnrollmentCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted enrollment cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted enrollment cycle"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.impressions - this.minimum) * 100) / 100;
  }

  copy(): WeightedEnrollmentCycle {
    return new WeightedEnrollmentCycle(
      this.code,
      this.label,
      this.contactEmail,
      this.checksum,
      this.notes,
      this.journeyId,
      this.minimum,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted enrollment cycle in status planned. */
export function newWeightedEnrollmentCycle(code: string, label: string): WeightedEnrollmentCycle {
  return new WeightedEnrollmentCycle(code, label, "", "", "", "", 0, 0, "planned");
}
