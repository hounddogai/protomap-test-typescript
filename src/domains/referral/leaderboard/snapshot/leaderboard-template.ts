import * as text from "../../../../kit/text.js";

/** Where a leaderboard template is in its life cycle. */
export type LeaderboardTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One leaderboard template, with what the planners need to act on it. */
export class LeaderboardTemplate {
  code: string;
  name: string;
  region: string;
  batchSize: number;
  createdAt: number;
  durationMinutes: number;
  status: LeaderboardTemplateStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    batchSize: number,
    createdAt: number,
    durationMinutes: number,
    status: LeaderboardTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: LeaderboardTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedValue(): number {
    return Math.round(this.batchSize * this.createdAt * 100) / 100;
  }

  copy(): LeaderboardTemplate {
    return new LeaderboardTemplate(
      this.code,
      this.name,
      this.region,
      this.batchSize,
      this.createdAt,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a leaderboard template in status proposed. */
export function newLeaderboardTemplate(code: string, name: string): LeaderboardTemplate {
  return new LeaderboardTemplate(code, name, "", 0, 0, 0, "proposed");
}
