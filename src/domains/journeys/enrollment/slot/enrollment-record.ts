import * as text from "../../../../kit/text.js";

/** Where a enrollment record is in its life cycle. */
export type EnrollmentRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a enrollment record and its current status. */
export class EnrollmentRecord {
  code: string;
  title: string;
  impressions: number;
  active: boolean;
  weight: number;
  status: EnrollmentRecordStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    active: boolean,
    weight: number,
    status: EnrollmentRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.active = active;
    this.weight = weight;
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

  canMoveTo(next: EnrollmentRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress";
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

  moveTo(next: EnrollmentRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round(this.impressions * this.weight * 100) / 100;
  }

  copy(): EnrollmentRecord {
    return new EnrollmentRecord(this.code, this.title, this.impressions, this.active, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a enrollment record in status planned. */
export function newEnrollmentRecord(code: string, title: string): EnrollmentRecord {
  return new EnrollmentRecord(code, title, 0, false, 0, "planned");
}
