import * as text from "../../../../kit/text.js";

/** Where a rolling frequency allocation is in its life cycle. */
export type RollingFrequencyAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a rolling frequency allocation and its current status. */
export class RollingFrequencyAllocation {
  code: string;
  name: string;
  attempts: number;
  bid: number;
  ratio: number;
  status: RollingFrequencyAllocationStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    bid: number,
    ratio: number,
    status: RollingFrequencyAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.bid = bid;
    this.ratio = ratio;
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

  canMoveTo(next: RollingFrequencyAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: RollingFrequencyAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling frequency allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.bid - this.attempts) * 100) / 100;
  }

  copy(): RollingFrequencyAllocation {
    return new RollingFrequencyAllocation(this.code, this.name, this.attempts, this.bid, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling frequency allocation in status new. */
export function newRollingFrequencyAllocation(code: string, name: string): RollingFrequencyAllocation {
  return new RollingFrequencyAllocation(code, name, 0, 0, 0, "new");
}
