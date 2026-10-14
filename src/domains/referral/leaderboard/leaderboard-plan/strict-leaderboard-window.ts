import * as text from "../../../../kit/text.js";

/** Where a strict leaderboard window is in its life cycle. */
export type StrictLeaderboardWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict leaderboard window as the leaderboard team keeps it. */
export class StrictLeaderboardWindow {
  code: string;
  label: string;
  amount: number;
  capacity: number;
  updatedAt: number;
  active: boolean;
  clicks: number;
  status: StrictLeaderboardWindowStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    capacity: number,
    updatedAt: number,
    active: boolean,
    clicks: number,
    status: StrictLeaderboardWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.capacity = capacity;
    this.updatedAt = updatedAt;
    this.active = active;
    this.clicks = clicks;
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

  canMoveTo(next: StrictLeaderboardWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictLeaderboardWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict leaderboard window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.updatedAt - this.clicks) * 100) / 100;
  }

  copy(): StrictLeaderboardWindow {
    return new StrictLeaderboardWindow(
      this.code,
      this.label,
      this.amount,
      this.capacity,
      this.updatedAt,
      this.active,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict leaderboard window in status planned. */
export function newStrictLeaderboardWindow(code: string, label: string): StrictLeaderboardWindow {
  return new StrictLeaderboardWindow(code, label, 0, 0, 0, false, 0, "planned");
}
