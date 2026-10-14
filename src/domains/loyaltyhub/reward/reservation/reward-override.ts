import * as text from "../../../../kit/text.js";

/** Where a reward override is in its life cycle. */
export type RewardOverrideStatus = "created" | "validated" | "published" | "retired";

/** One reward override, with what the planners need to act on it. */
export class RewardOverride {
  code: string;
  label: string;
  source: string;
  floorValue: number;
  rate: number;
  capacity: number;
  status: RewardOverrideStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    floorValue: number,
    rate: number,
    capacity: number,
    status: RewardOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.floorValue = floorValue;
    this.rate = rate;
    this.capacity = capacity;
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

  canMoveTo(next: RewardOverrideStatus): boolean {
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
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round(this.capacity * this.rate * 100) / 100;
  }

  copy(): RewardOverride {
    return new RewardOverride(
      this.code,
      this.label,
      this.source,
      this.floorValue,
      this.rate,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a reward override in status created. */
export function newRewardOverride(code: string, label: string): RewardOverride {
  return new RewardOverride(code, label, "", 0, 0, 0, "created");
}
