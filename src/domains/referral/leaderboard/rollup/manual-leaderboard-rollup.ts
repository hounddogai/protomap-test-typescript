/**
 * The manual leaderboard rollup records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual leaderboard rollup is in its life cycle. */
export type ManualLeaderboardRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual leaderboard rollup. Its code is unique within a tenant. */
export class ManualLeaderboardRollup {
  code: string;
  name: string;
  score: number;
  externalRef: string;
  channel: string;
  version: number;
  status: ManualLeaderboardRollupStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    externalRef: string,
    channel: string,
    version: number,
    status: ManualLeaderboardRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.externalRef = externalRef;
    this.channel = channel;
    this.version = version;
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

  canMoveTo(next: ManualLeaderboardRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualLeaderboardRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual leaderboard rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.score * this.version * 100) / 100;
  }

  copy(): ManualLeaderboardRollup {
    return new ManualLeaderboardRollup(
      this.code,
      this.name,
      this.score,
      this.externalRef,
      this.channel,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual leaderboard rollup in status planned. */
export function newManualLeaderboardRollup(code: string, name: string): ManualLeaderboardRollup {
  return new ManualLeaderboardRollup(code, name, 0, "", "", 0, "planned");
}
