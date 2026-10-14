import * as text from "../../../../kit/text.js";

/** Where a leaderboard cycle is in its life cycle. */
export type LeaderboardCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One leaderboard cycle, with what the planners need to act on it. */
export class LeaderboardCycle {
  code: string;
  title: string;
  rate: number;
  quantity: number;
  priority: number;
  tags: string[];
  bid: number;
  floorValue: number;
  journeyId: string;
  revision: number;
  status: LeaderboardCycleStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    quantity: number,
    priority: number,
    tags: string[],
    bid: number,
    floorValue: number,
    journeyId: string,
    revision: number,
    status: LeaderboardCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.quantity = quantity;
    this.priority = priority;
    this.tags = tags;
    this.bid = bid;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"leaderboard cycle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round(this.priority * this.floorValue * 100) / 100;
  }

  copy(): LeaderboardCycle {
    return new LeaderboardCycle(
      this.code,
      this.title,
      this.rate,
      this.quantity,
      this.priority,
      this.tags,
      this.bid,
      this.floorValue,
      this.journeyId,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a leaderboard cycle in status draft. */
export function newLeaderboardCycle(code: string, title: string): LeaderboardCycle {
  return new LeaderboardCycle(code, title, 0, 0, 0, [], 0, 0, "", 0, "draft");
}
