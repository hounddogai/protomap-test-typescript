import * as text from "../../../../kit/text.js";

/** Where a capped enrollment cycle is in its life cycle. */
export type CappedEnrollmentCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped enrollment cycle, with what the planners need to act on it. */
export class CappedEnrollmentCycle {
  code: string;
  name: string;
  segment: string;
  timezone: string;
  version: number;
  budget: number;
  status: CappedEnrollmentCycleStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    timezone: string,
    version: number,
    budget: number,
    status: CappedEnrollmentCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.timezone = timezone;
    this.version = version;
    this.budget = budget;
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

  canMoveTo(next: CappedEnrollmentCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedEnrollmentCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped enrollment cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.version - this.budget) * 100) / 100;
  }

  copy(): CappedEnrollmentCycle {
    return new CappedEnrollmentCycle(
      this.code,
      this.name,
      this.segment,
      this.timezone,
      this.version,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a capped enrollment cycle in status new. */
export function newCappedEnrollmentCycle(code: string, name: string): CappedEnrollmentCycle {
  return new CappedEnrollmentCycle(code, name, "", "", 0, 0, "new");
}
