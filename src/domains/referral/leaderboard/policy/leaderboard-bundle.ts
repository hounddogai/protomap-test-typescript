import * as text from "../../../../kit/text.js";

/** Where a leaderboard bundle is in its life cycle. */
export type LeaderboardBundleStatus = "created" | "validated" | "published" | "retired";

/** One leaderboard bundle, with what the planners need to act on it. */
export class LeaderboardBundle {
  code: string;
  label: string;
  version: number;
  cost: number;
  frequencyCap: number;
  startsAt: number;
  checksum: string;
  ceiling: number;
  cohort: string;
  score: number;
  priority: number;
  status: LeaderboardBundleStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    cost: number,
    frequencyCap: number,
    startsAt: number,
    checksum: string,
    ceiling: number,
    cohort: string,
    score: number,
    priority: number,
    status: LeaderboardBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.startsAt = startsAt;
    this.checksum = checksum;
    this.ceiling = ceiling;
    this.cohort = cohort;
    this.score = score;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LeaderboardBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.priority - this.startsAt) * 100) / 100;
  }

  copy(): LeaderboardBundle {
    return new LeaderboardBundle(
      this.code,
      this.label,
      this.version,
      this.cost,
      this.frequencyCap,
      this.startsAt,
      this.checksum,
      this.ceiling,
      this.cohort,
      this.score,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard bundle in status created. */
export function newLeaderboardBundle(code: string, label: string): LeaderboardBundle {
  return new LeaderboardBundle(code, label, 0, 0, 0, 0, "", 0, "", 0, 0, "created");
}
