import * as text from "../../../../kit/text.js";

/** Where a pending reputation segment is in its life cycle. */
export type PendingReputationSegmentStatus = "created" | "validated" | "published" | "retired";

/** One pending reputation segment, with what the planners need to act on it. */
export class PendingReputationSegment {
  code: string;
  title: string;
  cost: number;
  frequencyCap: number;
  reviewer: string;
  status: PendingReputationSegmentStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    frequencyCap: number,
    reviewer: string,
    status: PendingReputationSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingReputationSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingReputationSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reputation segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.cost + this.frequencyCap) * 100) / 100;
  }

  copy(): PendingReputationSegment {
    return new PendingReputationSegment(
      this.code,
      this.title,
      this.cost,
      this.frequencyCap,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending reputation segment in status created. */
export function newPendingReputationSegment(code: string, title: string): PendingReputationSegment {
  return new PendingReputationSegment(code, title, 0, 0, "", "created");
}
