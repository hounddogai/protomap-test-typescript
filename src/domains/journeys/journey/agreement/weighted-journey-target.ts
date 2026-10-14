import * as text from "../../../../kit/text.js";

/** Where a weighted journey target is in its life cycle. */
export type WeightedJourneyTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted journey target and its current status. */
export class WeightedJourneyTarget {
  code: string;
  label: string;
  version: number;
  endsAt: number;
  notes: string;
  capacity: number;
  status: WeightedJourneyTargetStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    endsAt: number,
    notes: string,
    capacity: number,
    status: WeightedJourneyTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.endsAt = endsAt;
    this.notes = notes;
    this.capacity = capacity;
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

  canMoveTo(next: WeightedJourneyTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
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

  moveTo(next: WeightedJourneyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted journey target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedTotal(): number {
    return Math.round((this.capacity - this.endsAt) * 100) / 100;
  }

  copy(): WeightedJourneyTarget {
    return new WeightedJourneyTarget(
      this.code,
      this.label,
      this.version,
      this.endsAt,
      this.notes,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted journey target in status planned. */
export function newWeightedJourneyTarget(code: string, label: string): WeightedJourneyTarget {
  return new WeightedJourneyTarget(code, label, 0, 0, "", 0, "planned");
}
