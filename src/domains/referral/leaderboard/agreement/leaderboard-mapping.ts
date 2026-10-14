import * as text from "../../../../kit/text.js";

/** Where a leaderboard mapping is in its life cycle. */
export type LeaderboardMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A leaderboard mapping. Its code is unique within a tenant. */
export class LeaderboardMapping {
  code: string;
  name: string;
  audienceId: string;
  bid: number;
  label: string;
  summary: string;
  clicks: number;
  status: LeaderboardMappingStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    bid: number,
    label: string,
    summary: string,
    clicks: number,
    status: LeaderboardMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.bid = bid;
    this.label = label;
    this.summary = summary;
    this.clicks = clicks;
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

  canMoveTo(next: LeaderboardMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LeaderboardMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.bid - this.clicks) * 100) / 100;
  }

  copy(): LeaderboardMapping {
    return new LeaderboardMapping(
      this.code,
      this.name,
      this.audienceId,
      this.bid,
      this.label,
      this.summary,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a leaderboard mapping in status proposed. */
export function newLeaderboardMapping(code: string, name: string): LeaderboardMapping {
  return new LeaderboardMapping(code, name, "", 0, "", "", 0, "proposed");
}
