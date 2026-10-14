import * as text from "../../../../kit/text.js";

/** Where a streak cycle is in its life cycle. */
export type StreakCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One streak cycle, with what the planners need to act on it. */
export class StreakCycle {
  code: string;
  name: string;
  approved: boolean;
  threshold: number;
  frequencyCap: number;
  status: StreakCycleStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    threshold: number,
    frequencyCap: number,
    status: StreakCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.threshold = threshold;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: StreakCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: StreakCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round(this.threshold * this.frequencyCap * 100) / 100;
  }

  copy(): StreakCycle {
    return new StreakCycle(this.code, this.name, this.approved, this.threshold, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a streak cycle in status idle. */
export function newStreakCycle(code: string, name: string): StreakCycle {
  return new StreakCycle(code, name, false, 0, 0, "idle");
}
