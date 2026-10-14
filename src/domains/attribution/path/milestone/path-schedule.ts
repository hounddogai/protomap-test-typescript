import * as text from "../../../../kit/text.js";

/** Where a path schedule is in its life cycle. */
export type PathScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A path schedule. Its code is unique within a tenant. */
export class PathSchedule {
  code: string;
  name: string;
  cohort: string;
  sequence: number;
  endsAt: number;
  approved: boolean;
  capacity: number;
  bid: number;
  status: PathScheduleStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    sequence: number,
    endsAt: number,
    approved: boolean,
    capacity: number,
    bid: number,
    status: PathScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.sequence = sequence;
    this.endsAt = endsAt;
    this.approved = approved;
    this.capacity = capacity;
    this.bid = bid;
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

  canMoveTo(next: PathScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PathScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.bid - this.capacity) * 100) / 100;
  }

  copy(): PathSchedule {
    return new PathSchedule(
      this.code,
      this.name,
      this.cohort,
      this.sequence,
      this.endsAt,
      this.approved,
      this.capacity,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a path schedule in status idle. */
export function newPathSchedule(code: string, name: string): PathSchedule {
  return new PathSchedule(code, name, "", 0, 0, false, 0, 0, "idle");
}
