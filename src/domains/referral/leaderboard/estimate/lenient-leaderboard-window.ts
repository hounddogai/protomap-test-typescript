import * as text from "../../../../kit/text.js";

/** Where a lenient leaderboard window is in its life cycle. */
export type LenientLeaderboardWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient leaderboard window and its current status. */
export class LenientLeaderboardWindow {
  code: string;
  label: string;
  clicks: number;
  category: string;
  priority: number;
  frequencyCap: number;
  expiresAt: number;
  status: LenientLeaderboardWindowStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    category: string,
    priority: number,
    frequencyCap: number,
    expiresAt: number,
    status: LenientLeaderboardWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.category = category;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: LenientLeaderboardWindowStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientLeaderboardWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient leaderboard window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt + this.frequencyCap) * 100) / 100;
  }

  copy(): LenientLeaderboardWindow {
    return new LenientLeaderboardWindow(
      this.code,
      this.label,
      this.clicks,
      this.category,
      this.priority,
      this.frequencyCap,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient leaderboard window in status new. */
export function newLenientLeaderboardWindow(code: string, label: string): LenientLeaderboardWindow {
  return new LenientLeaderboardWindow(code, label, 0, "", 0, 0, 0, "new");
}
