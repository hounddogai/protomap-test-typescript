import * as text from "../../../../kit/text.js";

/** Where a primary leaderboard adjustment is in its life cycle. */
export type PrimaryLeaderboardAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** One primary leaderboard adjustment, with what the planners need to act on it. */
export class PrimaryLeaderboardAdjustment {
  code: string;
  name: string;
  threshold: number;
  windowDays: number;
  margin: number;
  status: PrimaryLeaderboardAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    windowDays: number,
    margin: number,
    status: PrimaryLeaderboardAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.windowDays = windowDays;
    this.margin = margin;
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

  canMoveTo(next: PrimaryLeaderboardAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryLeaderboardAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary leaderboard adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.windowDays + this.margin) * 100) / 100;
  }

  copy(): PrimaryLeaderboardAdjustment {
    return new PrimaryLeaderboardAdjustment(
      this.code,
      this.name,
      this.threshold,
      this.windowDays,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary leaderboard adjustment in status created. */
export function newPrimaryLeaderboardAdjustment(code: string, name: string): PrimaryLeaderboardAdjustment {
  return new PrimaryLeaderboardAdjustment(code, name, 0, 0, 0, "created");
}
