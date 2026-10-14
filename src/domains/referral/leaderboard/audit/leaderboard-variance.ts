import * as text from "../../../../kit/text.js";

/** Where a leaderboard variance is in its life cycle. */
export type LeaderboardVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a leaderboard variance and its current status. */
export class LeaderboardVariance {
  code: string;
  label: string;
  updatedAt: number;
  limit: number;
  rate: number;
  approved: boolean;
  status: LeaderboardVarianceStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    limit: number,
    rate: number,
    approved: boolean,
    status: LeaderboardVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.rate = rate;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.updatedAt - this.rate) * 100) / 100;
  }

  copy(): LeaderboardVariance {
    return new LeaderboardVariance(
      this.code,
      this.label,
      this.updatedAt,
      this.limit,
      this.rate,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard variance in status requested. */
export function newLeaderboardVariance(code: string, label: string): LeaderboardVariance {
  return new LeaderboardVariance(code, label, 0, 0, 0, false, "requested");
}
