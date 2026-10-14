import * as text from "../../../../kit/text.js";

/** Where a streak segment is in its life cycle. */
export type StreakSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One streak segment, with what the planners need to act on it. */
export class StreakSegment {
  code: string;
  name: string;
  sequence: number;
  budget: number;
  rate: number;
  segment: string;
  createdAt: number;
  status: StreakSegmentStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    budget: number,
    rate: number,
    segment: string,
    createdAt: number,
    status: StreakSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.budget = budget;
    this.rate = rate;
    this.segment = segment;
    this.createdAt = createdAt;
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

  canMoveTo(next: StreakSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
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

  moveTo(next: StreakSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.rate * this.sequence * 100) / 100;
  }

  copy(): StreakSegment {
    return new StreakSegment(
      this.code,
      this.name,
      this.sequence,
      this.budget,
      this.rate,
      this.segment,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a streak segment in status new. */
export function newStreakSegment(code: string, name: string): StreakSegment {
  return new StreakSegment(code, name, 0, 0, 0, "", 0, "new");
}
