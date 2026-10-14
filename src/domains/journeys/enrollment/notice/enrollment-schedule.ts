import * as text from "../../../../kit/text.js";

/** Where a enrollment schedule is in its life cycle. */
export type EnrollmentScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A enrollment schedule as the enrollment team keeps it. */
export class EnrollmentSchedule {
  code: string;
  name: string;
  limit: number;
  description: string;
  segment: string;
  durationMinutes: number;
  expiresAt: number;
  attempts: number;
  status: EnrollmentScheduleStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    description: string,
    segment: string,
    durationMinutes: number,
    expiresAt: number,
    attempts: number,
    status: EnrollmentScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.description = description;
    this.segment = segment;
    this.durationMinutes = durationMinutes;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: EnrollmentScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedLoad(): number {
    return Math.round((this.expiresAt + this.attempts) * 100) / 100;
  }

  copy(): EnrollmentSchedule {
    return new EnrollmentSchedule(
      this.code,
      this.name,
      this.limit,
      this.description,
      this.segment,
      this.durationMinutes,
      this.expiresAt,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a enrollment schedule in status new. */
export function newEnrollmentSchedule(code: string, name: string): EnrollmentSchedule {
  return new EnrollmentSchedule(code, name, 0, "", "", 0, 0, 0, "new");
}
