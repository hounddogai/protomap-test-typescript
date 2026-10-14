import * as text from "../../../../kit/text.js";

/** Where a fallback leaderboard budget is in its life cycle. */
export type FallbackLeaderboardBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback leaderboard budget as the leaderboard team keeps it. */
export class FallbackLeaderboardBudget {
  code: string;
  name: string;
  budget: number;
  source: string;
  impressions: number;
  status: FallbackLeaderboardBudgetStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    source: string,
    impressions: number,
    status: FallbackLeaderboardBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.source = source;
    this.impressions = impressions;
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

  canMoveTo(next: FallbackLeaderboardBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackLeaderboardBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback leaderboard budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback leaderboard budget"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.impressions * this.budget * 100) / 100;
  }

  copy(): FallbackLeaderboardBudget {
    return new FallbackLeaderboardBudget(this.code, this.name, this.budget, this.source, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback leaderboard budget in status open. */
export function newFallbackLeaderboardBudget(code: string, name: string): FallbackLeaderboardBudget {
  return new FallbackLeaderboardBudget(code, name, 0, "", 0, "open");
}
