import * as text from "../../../../kit/text.js";

/** Where a cohort snapshot is in its life cycle. */
export type CohortSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One cohort snapshot, with what the planners need to act on it. */
export class CohortSnapshot {
  code: string;
  label: string;
  active: boolean;
  segment: string;
  ceiling: number;
  description: string;
  endsAt: number;
  threshold: number;
  status: CohortSnapshotStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    segment: string,
    ceiling: number,
    description: string,
    endsAt: number,
    threshold: number,
    status: CohortSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.segment = segment;
    this.ceiling = ceiling;
    this.description = description;
    this.endsAt = endsAt;
    this.threshold = threshold;
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

  canMoveTo(next: CohortSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CohortSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.threshold + this.endsAt) * 100) / 100;
  }

  copy(): CohortSnapshot {
    return new CohortSnapshot(
      this.code,
      this.label,
      this.active,
      this.segment,
      this.ceiling,
      this.description,
      this.endsAt,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a cohort snapshot in status planned. */
export function newCohortSnapshot(code: string, label: string): CohortSnapshot {
  return new CohortSnapshot(code, label, false, "", 0, "", 0, 0, "planned");
}
