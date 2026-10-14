import * as text from "../../../../kit/text.js";

/** Where a reward preference is in its life cycle. */
export type RewardPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One reward preference, with what the planners need to act on it. */
export class RewardPreference {
  code: string;
  name: string;
  createdAt: number;
  conversionRate: number;
  pinned: boolean;
  status: RewardPreferenceStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    conversionRate: number,
    pinned: boolean,
    status: RewardPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
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

  canMoveTo(next: RewardPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt - this.conversionRate) * 100) / 100;
  }

  copy(): RewardPreference {
    return new RewardPreference(this.code, this.name, this.createdAt, this.conversionRate, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a reward preference in status idle. */
export function newRewardPreference(code: string, name: string): RewardPreference {
  return new RewardPreference(code, name, 0, 0, false, "idle");
}
