import * as text from "../../../../kit/text.js";

/** Where a seasonal leaderboard cycle is in its life cycle. */
export type SeasonalLeaderboardCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal leaderboard cycle as the leaderboard team keeps it. */
export class SeasonalLeaderboardCycle {
  code: string;
  label: string;
  floorValue: number;
  description: string;
  version: number;
  approved: boolean;
  discount: number;
  category: string;
  budget: number;
  status: SeasonalLeaderboardCycleStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    description: string,
    version: number,
    approved: boolean,
    discount: number,
    category: string,
    budget: number,
    status: SeasonalLeaderboardCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.description = description;
    this.version = version;
    this.approved = approved;
    this.discount = discount;
    this.category = category;
    this.budget = budget;
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

  canMoveTo(next: SeasonalLeaderboardCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalLeaderboardCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal leaderboard cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.discount - this.floorValue) * 100) / 100;
  }

  copy(): SeasonalLeaderboardCycle {
    return new SeasonalLeaderboardCycle(
      this.code,
      this.label,
      this.floorValue,
      this.description,
      this.version,
      this.approved,
      this.discount,
      this.category,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal leaderboard cycle in status new. */
export function newSeasonalLeaderboardCycle(code: string, label: string): SeasonalLeaderboardCycle {
  return new SeasonalLeaderboardCycle(code, label, 0, "", 0, false, 0, "", 0, "new");
}
