import * as text from "../../../../kit/text.js";

/** Where a leaderboard policy is in its life cycle. */
export type LeaderboardPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a leaderboard policy and its current status. */
export class LeaderboardPolicy {
  code: string;
  label: string;
  floorValue: number;
  ratio: number;
  segment: string;
  durationMinutes: number;
  status: LeaderboardPolicyStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    ratio: number,
    segment: string,
    durationMinutes: number,
    status: LeaderboardPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.ratio = ratio;
    this.segment = segment;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: LeaderboardPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "resolved";
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

  moveTo(next: LeaderboardPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round(this.floorValue * this.ratio * 100) / 100;
  }

  copy(): LeaderboardPolicy {
    return new LeaderboardPolicy(
      this.code,
      this.label,
      this.floorValue,
      this.ratio,
      this.segment,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a leaderboard policy in status open. */
export function newLeaderboardPolicy(code: string, label: string): LeaderboardPolicy {
  return new LeaderboardPolicy(code, label, 0, 0, "", 0, "open");
}
