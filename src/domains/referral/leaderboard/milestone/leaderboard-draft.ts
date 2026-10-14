import * as text from "../../../../kit/text.js";

/** Where a leaderboard draft is in its life cycle. */
export type LeaderboardDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a leaderboard draft and its current status. */
export class LeaderboardDraft {
  code: string;
  label: string;
  margin: number;
  locale: string;
  budget: number;
  title: string;
  startsAt: number;
  notes: string;
  threshold: number;
  retries: number;
  status: LeaderboardDraftStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    locale: string,
    budget: number,
    title: string,
    startsAt: number,
    notes: string,
    threshold: number,
    retries: number,
    status: LeaderboardDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.locale = locale;
    this.budget = budget;
    this.title = title;
    this.startsAt = startsAt;
    this.notes = notes;
    this.threshold = threshold;
    this.retries = retries;
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

  canMoveTo(next: LeaderboardDraftStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LeaderboardDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.margin * this.startsAt * 100) / 100;
  }

  copy(): LeaderboardDraft {
    return new LeaderboardDraft(
      this.code,
      this.label,
      this.margin,
      this.locale,
      this.budget,
      this.title,
      this.startsAt,
      this.notes,
      this.threshold,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a leaderboard draft in status new. */
export function newLeaderboardDraft(code: string, label: string): LeaderboardDraft {
  return new LeaderboardDraft(code, label, 0, "", 0, "", 0, "", 0, 0, "new");
}
