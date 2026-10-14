import * as text from "../../../../kit/text.js";

/** Where a cohort segment is in its life cycle. */
export type CohortSegmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A cohort segment as the cohort team keeps it. */
export class CohortSegment {
  code: string;
  title: string;
  segment: string;
  category: string;
  sequence: number;
  name: string;
  status: CohortSegmentStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    category: string,
    sequence: number,
    name: string,
    status: CohortSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.category = category;
    this.sequence = sequence;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortSegmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CohortSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): CohortSegment {
    return new CohortSegment(this.code, this.title, this.segment, this.category, this.sequence, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a cohort segment in status idle. */
export function newCohortSegment(code: string, title: string): CohortSegment {
  return new CohortSegment(code, title, "", "", 0, "", "idle");
}
