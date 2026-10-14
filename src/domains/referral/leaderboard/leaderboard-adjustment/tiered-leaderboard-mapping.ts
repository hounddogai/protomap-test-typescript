import * as text from "../../../../kit/text.js";

/** Where a tiered leaderboard mapping is in its life cycle. */
export type TieredLeaderboardMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered leaderboard mapping and its current status. */
export class TieredLeaderboardMapping {
  code: string;
  label: string;
  segment: string;
  sequence: number;
  maximum: number;
  status: TieredLeaderboardMappingStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    sequence: number,
    maximum: number,
    status: TieredLeaderboardMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.sequence = sequence;
    this.maximum = maximum;
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

  canMoveTo(next: TieredLeaderboardMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredLeaderboardMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered leaderboard mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered leaderboard mapping"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.maximum * this.sequence * 100) / 100;
  }

  copy(): TieredLeaderboardMapping {
    return new TieredLeaderboardMapping(this.code, this.label, this.segment, this.sequence, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered leaderboard mapping in status idle. */
export function newTieredLeaderboardMapping(code: string, label: string): TieredLeaderboardMapping {
  return new TieredLeaderboardMapping(code, label, "", 0, 0, "idle");
}
