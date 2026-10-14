import * as text from "../../../../kit/text.js";

/** Where a reward cycle is in its life cycle. */
export type RewardCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One reward cycle, with what the planners need to act on it. */
export class RewardCycle {
  code: string;
  title: string;
  weight: number;
  score: number;
  label: string;
  timezone: string;
  bid: number;
  graceDays: number;
  sendAt: number;
  batchSize: number;
  status: RewardCycleStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    score: number,
    label: string,
    timezone: string,
    bid: number,
    graceDays: number,
    sendAt: number,
    batchSize: number,
    status: RewardCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.score = score;
    this.label = label;
    this.timezone = timezone;
    this.bid = bid;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round(this.weight * this.sendAt * 100) / 100;
  }

  copy(): RewardCycle {
    return new RewardCycle(
      this.code,
      this.title,
      this.weight,
      this.score,
      this.label,
      this.timezone,
      this.bid,
      this.graceDays,
      this.sendAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reward cycle in status planned. */
export function newRewardCycle(code: string, title: string): RewardCycle {
  return new RewardCycle(code, title, 0, 0, "", "", 0, 0, 0, 0, "planned");
}
