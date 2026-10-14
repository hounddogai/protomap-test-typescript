import * as text from "../../../../kit/text.js";

/** Where a seasonal leaderboard snapshot is in its life cycle. */
export type SeasonalLeaderboardSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal leaderboard snapshot and its current status. */
export class SeasonalLeaderboardSnapshot {
  code: string;
  title: string;
  visible: boolean;
  timezone: string;
  endsAt: number;
  externalRef: string;
  ceiling: number;
  conversionRate: number;
  createdAt: number;
  label: string;
  status: SeasonalLeaderboardSnapshotStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    timezone: string,
    endsAt: number,
    externalRef: string,
    ceiling: number,
    conversionRate: number,
    createdAt: number,
    label: string,
    status: SeasonalLeaderboardSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.ceiling = ceiling;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
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

  canMoveTo(next: SeasonalLeaderboardSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalLeaderboardSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal leaderboard snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal leaderboard snapshot"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.ceiling + this.conversionRate) * 100) / 100;
  }

  copy(): SeasonalLeaderboardSnapshot {
    return new SeasonalLeaderboardSnapshot(
      this.code,
      this.title,
      this.visible,
      this.timezone,
      this.endsAt,
      this.externalRef,
      this.ceiling,
      this.conversionRate,
      this.createdAt,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal leaderboard snapshot in status planned. */
export function newSeasonalLeaderboardSnapshot(code: string, title: string): SeasonalLeaderboardSnapshot {
  return new SeasonalLeaderboardSnapshot(code, title, false, "", 0, "", 0, 0, 0, "", "planned");
}
