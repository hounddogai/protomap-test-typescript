import * as text from "../../../../kit/text.js";

/** Where a leaderboard baseline is in its life cycle. */
export type LeaderboardBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One leaderboard baseline, with what the planners need to act on it. */
export class LeaderboardBaseline {
  code: string;
  title: string;
  maximum: number;
  cohort: string;
  audienceId: string;
  rate: number;
  channel: string;
  bid: number;
  minimum: number;
  status: LeaderboardBaselineStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    cohort: string,
    audienceId: string,
    rate: number,
    channel: string,
    bid: number,
    minimum: number,
    status: LeaderboardBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.cohort = cohort;
    this.audienceId = audienceId;
    this.rate = rate;
    this.channel = channel;
    this.bid = bid;
    this.minimum = minimum;
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

  canMoveTo(next: LeaderboardBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: LeaderboardBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedLoad(): number {
    return Math.round(this.bid * this.minimum * 100) / 100;
  }

  copy(): LeaderboardBaseline {
    return new LeaderboardBaseline(
      this.code,
      this.title,
      this.maximum,
      this.cohort,
      this.audienceId,
      this.rate,
      this.channel,
      this.bid,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a leaderboard baseline in status planned. */
export function newLeaderboardBaseline(code: string, title: string): LeaderboardBaseline {
  return new LeaderboardBaseline(code, title, 0, "", "", 0, "", 0, 0, "planned");
}
