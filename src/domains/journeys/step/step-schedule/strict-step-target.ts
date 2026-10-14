import * as text from "../../../../kit/text.js";

/** Where a strict step target is in its life cycle. */
export type StrictStepTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict step target as the step team keeps it. */
export class StrictStepTarget {
  code: string;
  title: string;
  cohort: string;
  ratio: number;
  budget: number;
  capacity: number;
  floorValue: number;
  segment: string;
  attempts: number;
  pinned: boolean;
  status: StrictStepTargetStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    ratio: number,
    budget: number,
    capacity: number,
    floorValue: number,
    segment: string,
    attempts: number,
    pinned: boolean,
    status: StrictStepTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.ratio = ratio;
    this.budget = budget;
    this.capacity = capacity;
    this.floorValue = floorValue;
    this.segment = segment;
    this.attempts = attempts;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictStepTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictStepTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict step target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict step target"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget + this.attempts) * 100) / 100;
  }

  copy(): StrictStepTarget {
    return new StrictStepTarget(
      this.code,
      this.title,
      this.cohort,
      this.ratio,
      this.budget,
      this.capacity,
      this.floorValue,
      this.segment,
      this.attempts,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict step target in status draft. */
export function newStrictStepTarget(code: string, title: string): StrictStepTarget {
  return new StrictStepTarget(code, title, "", 0, 0, 0, 0, "", 0, false, "draft");
}
