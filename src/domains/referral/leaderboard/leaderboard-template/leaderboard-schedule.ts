import * as text from "../../../../kit/text.js";

/** Where a leaderboard schedule is in its life cycle. */
export type LeaderboardScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a leaderboard schedule and its current status. */
export class LeaderboardSchedule {
  code: string;
  label: string;
  revision: number;
  bid: number;
  rate: number;
  floorValue: number;
  priority: number;
  version: number;
  archived: boolean;
  campaignRef: string;
  impressions: number;
  status: LeaderboardScheduleStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    bid: number,
    rate: number,
    floorValue: number,
    priority: number,
    version: number,
    archived: boolean,
    campaignRef: string,
    impressions: number,
    status: LeaderboardScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.bid = bid;
    this.rate = rate;
    this.floorValue = floorValue;
    this.priority = priority;
    this.version = version;
    this.archived = archived;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"leaderboard schedule"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.version + this.priority) * 100) / 100;
  }

  copy(): LeaderboardSchedule {
    return new LeaderboardSchedule(
      this.code,
      this.label,
      this.revision,
      this.bid,
      this.rate,
      this.floorValue,
      this.priority,
      this.version,
      this.archived,
      this.campaignRef,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard schedule in status proposed. */
export function newLeaderboardSchedule(code: string, label: string): LeaderboardSchedule {
  return new LeaderboardSchedule(code, label, 0, 0, 0, 0, 0, 0, false, "", 0, "proposed");
}
