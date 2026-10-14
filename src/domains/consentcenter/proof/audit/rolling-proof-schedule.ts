import * as text from "../../../../kit/text.js";

/** Where a rolling proof schedule is in its life cycle. */
export type RollingProofScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling proof schedule as the proof team keeps it. */
export class RollingProofSchedule {
  code: string;
  name: string;
  threshold: number;
  budget: number;
  sequence: number;
  timezone: string;
  graceDays: number;
  archived: boolean;
  status: RollingProofScheduleStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    budget: number,
    sequence: number,
    timezone: string,
    graceDays: number,
    archived: boolean,
    status: RollingProofScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.budget = budget;
    this.sequence = sequence;
    this.timezone = timezone;
    this.graceDays = graceDays;
    this.archived = archived;
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

  canMoveTo(next: RollingProofScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingProofScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling proof schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.budget * this.sequence * 100) / 100;
  }

  copy(): RollingProofSchedule {
    return new RollingProofSchedule(
      this.code,
      this.name,
      this.threshold,
      this.budget,
      this.sequence,
      this.timezone,
      this.graceDays,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling proof schedule in status new. */
export function newRollingProofSchedule(code: string, name: string): RollingProofSchedule {
  return new RollingProofSchedule(code, name, 0, 0, 0, "", 0, false, "new");
}
