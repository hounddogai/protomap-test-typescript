import * as text from "../../../../kit/text.js";

/** Where a manual leaderboard checkpoint is in its life cycle. */
export type ManualLeaderboardCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** One manual leaderboard checkpoint, with what the planners need to act on it. */
export class ManualLeaderboardCheckpoint {
  code: string;
  title: string;
  phone: string;
  attributes: Map<string, string>;
  graceDays: number;
  ceiling: number;
  status: ManualLeaderboardCheckpointStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    attributes: Map<string, string>,
    graceDays: number,
    ceiling: number,
    status: ManualLeaderboardCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.attributes = attributes;
    this.graceDays = graceDays;
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

  canMoveTo(next: ManualLeaderboardCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
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

  moveTo(next: ManualLeaderboardCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual leaderboard checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual leaderboard checkpoint"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.graceDays * this.ceiling * 100) / 100;
  }

  copy(): ManualLeaderboardCheckpoint {
    return new ManualLeaderboardCheckpoint(
      this.code,
      this.title,
      this.phone,
      this.attributes,
      this.graceDays,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual leaderboard checkpoint in status new. */
export function newManualLeaderboardCheckpoint(code: string, title: string): ManualLeaderboardCheckpoint {
  return new ManualLeaderboardCheckpoint(code, title, "", new Map<string, string>(), 0, 0, "new");
}
