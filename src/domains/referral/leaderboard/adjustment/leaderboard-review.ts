import * as text from "../../../../kit/text.js";

/** Where a leaderboard review is in its life cycle. */
export type LeaderboardReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A leaderboard review as the leaderboard team keeps it. */
export class LeaderboardReview {
  code: string;
  name: string;
  region: string;
  budget: number;
  cost: number;
  endsAt: number;
  channel: string;
  windowDays: number;
  weight: number;
  capacity: number;
  graceDays: number;
  status: LeaderboardReviewStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    budget: number,
    cost: number,
    endsAt: number,
    channel: string,
    windowDays: number,
    weight: number,
    capacity: number,
    graceDays: number,
    status: LeaderboardReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.budget = budget;
    this.cost = cost;
    this.endsAt = endsAt;
    this.channel = channel;
    this.windowDays = windowDays;
    this.weight = weight;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardReviewStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"leaderboard review"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.windowDays + this.cost) * 100) / 100;
  }

  copy(): LeaderboardReview {
    return new LeaderboardReview(
      this.code,
      this.name,
      this.region,
      this.budget,
      this.cost,
      this.endsAt,
      this.channel,
      this.windowDays,
      this.weight,
      this.capacity,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a leaderboard review in status open. */
export function newLeaderboardReview(code: string, name: string): LeaderboardReview {
  return new LeaderboardReview(code, name, "", 0, 0, 0, "", 0, 0, 0, 0, "open");
}
