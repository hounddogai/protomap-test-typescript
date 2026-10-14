import * as text from "../../../../kit/text.js";

/** Where a pending leaderboard mapping is in its life cycle. */
export type PendingLeaderboardMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending leaderboard mapping and its current status. */
export class PendingLeaderboardMapping {
  code: string;
  name: string;
  threshold: number;
  cost: number;
  cohort: string;
  sendAt: number;
  status: PendingLeaderboardMappingStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    cost: number,
    cohort: string,
    sendAt: number,
    status: PendingLeaderboardMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.cost = cost;
    this.cohort = cohort;
    this.sendAt = sendAt;
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

  canMoveTo(next: PendingLeaderboardMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingLeaderboardMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending leaderboard mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round(this.threshold * this.cost * 100) / 100;
  }

  copy(): PendingLeaderboardMapping {
    return new PendingLeaderboardMapping(
      this.code,
      this.name,
      this.threshold,
      this.cost,
      this.cohort,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending leaderboard mapping in status draft. */
export function newPendingLeaderboardMapping(code: string, name: string): PendingLeaderboardMapping {
  return new PendingLeaderboardMapping(code, name, 0, 0, "", 0, "draft");
}
