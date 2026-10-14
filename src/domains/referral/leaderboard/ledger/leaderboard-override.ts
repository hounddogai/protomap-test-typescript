import * as text from "../../../../kit/text.js";

/** Where a leaderboard override is in its life cycle. */
export type LeaderboardOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a leaderboard override and its current status. */
export class LeaderboardOverride {
  code: string;
  label: string;
  frequencyCap: number;
  name: string;
  graceDays: number;
  status: LeaderboardOverrideStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    name: string,
    graceDays: number,
    status: LeaderboardOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.name = name;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LeaderboardOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.graceDays - this.frequencyCap) * 100) / 100;
  }

  copy(): LeaderboardOverride {
    return new LeaderboardOverride(this.code, this.label, this.frequencyCap, this.name, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a leaderboard override in status new. */
export function newLeaderboardOverride(code: string, label: string): LeaderboardOverride {
  return new LeaderboardOverride(code, label, 0, "", 0, "new");
}
