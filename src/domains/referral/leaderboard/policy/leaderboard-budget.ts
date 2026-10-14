import * as text from "../../../../kit/text.js";

/** Where a leaderboard budget is in its life cycle. */
export type LeaderboardBudgetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a leaderboard budget and its current status. */
export class LeaderboardBudget {
  code: string;
  name: string;
  audienceId: string;
  locale: string;
  startsAt: number;
  label: string;
  status: LeaderboardBudgetStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    locale: string,
    startsAt: number,
    label: string,
    status: LeaderboardBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.locale = locale;
    this.startsAt = startsAt;
    this.label = label;
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

  canMoveTo(next: LeaderboardBudgetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LeaderboardBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): LeaderboardBudget {
    return new LeaderboardBudget(
      this.code,
      this.name,
      this.audienceId,
      this.locale,
      this.startsAt,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a leaderboard budget in status planned. */
export function newLeaderboardBudget(code: string, name: string): LeaderboardBudget {
  return new LeaderboardBudget(code, name, "", "", 0, "", "planned");
}
