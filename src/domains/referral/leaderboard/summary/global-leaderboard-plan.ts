import * as text from "../../../../kit/text.js";

/** Where a global leaderboard plan is in its life cycle. */
export type GlobalLeaderboardPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global leaderboard plan, with what the planners need to act on it. */
export class GlobalLeaderboardPlan {
  code: string;
  name: string;
  country: string;
  graceDays: number;
  journeyId: string;
  startsAt: number;
  source: string;
  status: GlobalLeaderboardPlanStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    graceDays: number,
    journeyId: string,
    startsAt: number,
    source: string,
    status: GlobalLeaderboardPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.graceDays = graceDays;
    this.journeyId = journeyId;
    this.startsAt = startsAt;
    this.source = source;
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

  canMoveTo(next: GlobalLeaderboardPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalLeaderboardPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global leaderboard plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global leaderboard plan"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.graceDays + this.startsAt) * 100) / 100;
  }

  copy(): GlobalLeaderboardPlan {
    return new GlobalLeaderboardPlan(
      this.code,
      this.name,
      this.country,
      this.graceDays,
      this.journeyId,
      this.startsAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global leaderboard plan in status open. */
export function newGlobalLeaderboardPlan(code: string, name: string): GlobalLeaderboardPlan {
  return new GlobalLeaderboardPlan(code, name, "", 0, "", 0, "", "open");
}
