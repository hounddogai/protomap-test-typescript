import * as text from "../../../../kit/text.js";

/** Where a leaderboard rollup is in its life cycle. */
export type LeaderboardRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One leaderboard rollup, with what the planners need to act on it. */
export class LeaderboardRollup {
  code: string;
  title: string;
  priority: number;
  approved: boolean;
  segment: string;
  startsAt: number;
  description: string;
  durationMinutes: number;
  quantity: number;
  amount: number;
  frequencyCap: number;
  status: LeaderboardRollupStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    approved: boolean,
    segment: string,
    startsAt: number,
    description: string,
    durationMinutes: number,
    quantity: number,
    amount: number,
    frequencyCap: number,
    status: LeaderboardRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.approved = approved;
    this.segment = segment;
    this.startsAt = startsAt;
    this.description = description;
    this.durationMinutes = durationMinutes;
    this.quantity = quantity;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: LeaderboardRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"leaderboard rollup"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.priority - this.durationMinutes) * 100) / 100;
  }

  copy(): LeaderboardRollup {
    return new LeaderboardRollup(
      this.code,
      this.title,
      this.priority,
      this.approved,
      this.segment,
      this.startsAt,
      this.description,
      this.durationMinutes,
      this.quantity,
      this.amount,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a leaderboard rollup in status planned. */
export function newLeaderboardRollup(code: string, title: string): LeaderboardRollup {
  return new LeaderboardRollup(code, title, 0, false, "", 0, "", 0, 0, 0, 0, "planned");
}
