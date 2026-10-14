import * as text from "../../../../kit/text.js";

/** Where a leaderboard checkpoint is in its life cycle. */
export type LeaderboardCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One leaderboard checkpoint, with what the planners need to act on it. */
export class LeaderboardCheckpoint {
  code: string;
  label: string;
  cohort: string;
  segment: string;
  startsAt: number;
  cost: number;
  ratio: number;
  locale: string;
  status: LeaderboardCheckpointStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    segment: string,
    startsAt: number,
    cost: number,
    ratio: number,
    locale: string,
    status: LeaderboardCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.segment = segment;
    this.startsAt = startsAt;
    this.cost = cost;
    this.ratio = ratio;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.ratio + this.startsAt) * 100) / 100;
  }

  copy(): LeaderboardCheckpoint {
    return new LeaderboardCheckpoint(
      this.code,
      this.label,
      this.cohort,
      this.segment,
      this.startsAt,
      this.cost,
      this.ratio,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a leaderboard checkpoint in status idle. */
export function newLeaderboardCheckpoint(code: string, label: string): LeaderboardCheckpoint {
  return new LeaderboardCheckpoint(code, label, "", "", 0, 0, 0, "", "idle");
}
