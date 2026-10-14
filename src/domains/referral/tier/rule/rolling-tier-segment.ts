import * as text from "../../../../kit/text.js";

/** Where a rolling tier segment is in its life cycle. */
export type RollingTierSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One rolling tier segment, with what the planners need to act on it. */
export class RollingTierSegment {
  code: string;
  label: string;
  ownerId: string;
  durationMinutes: number;
  rate: number;
  approved: boolean;
  priority: number;
  status: RollingTierSegmentStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    durationMinutes: number,
    rate: number,
    approved: boolean,
    priority: number,
    status: RollingTierSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.approved = approved;
    this.priority = priority;
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

  canMoveTo(next: RollingTierSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
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

  moveTo(next: RollingTierSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling tier segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling tier segment"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.rate + this.priority) * 100) / 100;
  }

  copy(): RollingTierSegment {
    return new RollingTierSegment(
      this.code,
      this.label,
      this.ownerId,
      this.durationMinutes,
      this.rate,
      this.approved,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling tier segment in status new. */
export function newRollingTierSegment(code: string, label: string): RollingTierSegment {
  return new RollingTierSegment(code, label, "", 0, 0, false, 0, "new");
}
