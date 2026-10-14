import * as text from "../../../../kit/text.js";

/** Where a weighted streak cycle is in its life cycle. */
export type WeightedStreakCycleStatus = "created" | "validated" | "published" | "retired";

/** The record of a weighted streak cycle and its current status. */
export class WeightedStreakCycle {
  code: string;
  label: string;
  minimum: number;
  createdAt: number;
  retries: number;
  status: WeightedStreakCycleStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    createdAt: number,
    retries: number,
    status: WeightedStreakCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.createdAt = createdAt;
    this.retries = retries;
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

  canMoveTo(next: WeightedStreakCycleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedStreakCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted streak cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"weighted streak cycle"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.minimum - this.createdAt) * 100) / 100;
  }

  copy(): WeightedStreakCycle {
    return new WeightedStreakCycle(this.code, this.label, this.minimum, this.createdAt, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted streak cycle in status created. */
export function newWeightedStreakCycle(code: string, label: string): WeightedStreakCycle {
  return new WeightedStreakCycle(code, label, 0, 0, 0, "created");
}
