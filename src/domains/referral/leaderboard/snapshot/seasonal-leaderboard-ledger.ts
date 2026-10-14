import * as text from "../../../../kit/text.js";

/** Where a seasonal leaderboard ledger is in its life cycle. */
export type SeasonalLeaderboardLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal leaderboard ledger. Its code is unique within a tenant. */
export class SeasonalLeaderboardLedger {
  code: string;
  title: string;
  frequencyCap: number;
  clicks: number;
  active: boolean;
  updatedAt: number;
  journeyId: string;
  ceiling: number;
  status: SeasonalLeaderboardLedgerStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    clicks: number,
    active: boolean,
    updatedAt: number,
    journeyId: string,
    ceiling: number,
    status: SeasonalLeaderboardLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.active = active;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
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

  canMoveTo(next: SeasonalLeaderboardLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalLeaderboardLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal leaderboard ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"seasonal leaderboard ledger"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.frequencyCap + this.clicks) * 100) / 100;
  }

  copy(): SeasonalLeaderboardLedger {
    return new SeasonalLeaderboardLedger(
      this.code,
      this.title,
      this.frequencyCap,
      this.clicks,
      this.active,
      this.updatedAt,
      this.journeyId,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal leaderboard ledger in status new. */
export function newSeasonalLeaderboardLedger(code: string, title: string): SeasonalLeaderboardLedger {
  return new SeasonalLeaderboardLedger(code, title, 0, 0, false, 0, "", 0, "new");
}
