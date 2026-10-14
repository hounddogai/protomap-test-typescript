import * as text from "../../../../kit/text.js";

/** Where a step target is in its life cycle. */
export type StepTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a step target and its current status. */
export class StepTarget {
  code: string;
  label: string;
  impressions: number;
  rate: number;
  approved: boolean;
  checksum: string;
  notes: string;
  endsAt: number;
  limit: number;
  status: StepTargetStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    rate: number,
    approved: boolean,
    checksum: string,
    notes: string,
    endsAt: number,
    limit: number,
    status: StepTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.rate = rate;
    this.approved = approved;
    this.checksum = checksum;
    this.notes = notes;
    this.endsAt = endsAt;
    this.limit = limit;
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

  canMoveTo(next: StepTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.limit + this.endsAt) * 100) / 100;
  }

  copy(): StepTarget {
    return new StepTarget(
      this.code,
      this.label,
      this.impressions,
      this.rate,
      this.approved,
      this.checksum,
      this.notes,
      this.endsAt,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a step target in status planned. */
export function newStepTarget(code: string, label: string): StepTarget {
  return new StepTarget(code, label, 0, 0, false, "", "", 0, 0, "planned");
}
