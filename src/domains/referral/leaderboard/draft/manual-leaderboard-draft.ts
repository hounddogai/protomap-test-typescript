/**
 * The manual leaderboard draft records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual leaderboard draft is in its life cycle. */
export type ManualLeaderboardDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One manual leaderboard draft, with what the planners need to act on it. */
export class ManualLeaderboardDraft {
  code: string;
  title: string;
  channel: string;
  expiresAt: number;
  budget: number;
  utmSource: string;
  maximum: number;
  margin: number;
  status: ManualLeaderboardDraftStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    expiresAt: number,
    budget: number,
    utmSource: string,
    maximum: number,
    margin: number,
    status: ManualLeaderboardDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualLeaderboardDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualLeaderboardDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual leaderboard draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.budget * this.expiresAt * 100) / 100;
  }

  copy(): ManualLeaderboardDraft {
    return new ManualLeaderboardDraft(
      this.code,
      this.title,
      this.channel,
      this.expiresAt,
      this.budget,
      this.utmSource,
      this.maximum,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual leaderboard draft in status proposed. */
export function newManualLeaderboardDraft(code: string, title: string): ManualLeaderboardDraft {
  return new ManualLeaderboardDraft(code, title, "", 0, 0, "", 0, 0, "proposed");
}
