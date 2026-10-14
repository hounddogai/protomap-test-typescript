import * as text from "../../../../kit/text.js";

/** Where a rolling leaderboard draft is in its life cycle. */
export type RollingLeaderboardDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling leaderboard draft. Its code is unique within a tenant. */
export class RollingLeaderboardDraft {
  code: string;
  title: string;
  region: string;
  frequencyCap: number;
  visible: boolean;
  bid: number;
  attempts: number;
  maximum: number;
  summary: string;
  weight: number;
  contactEmail: string;
  status: RollingLeaderboardDraftStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    frequencyCap: number,
    visible: boolean,
    bid: number,
    attempts: number,
    maximum: number,
    summary: string,
    weight: number,
    contactEmail: string,
    status: RollingLeaderboardDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.frequencyCap = frequencyCap;
    this.visible = visible;
    this.bid = bid;
    this.attempts = attempts;
    this.maximum = maximum;
    this.summary = summary;
    this.weight = weight;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: RollingLeaderboardDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: RollingLeaderboardDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling leaderboard draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netTotal(): number {
    return Math.round((this.maximum + this.weight) * 100) / 100;
  }

  copy(): RollingLeaderboardDraft {
    return new RollingLeaderboardDraft(
      this.code,
      this.title,
      this.region,
      this.frequencyCap,
      this.visible,
      this.bid,
      this.attempts,
      this.maximum,
      this.summary,
      this.weight,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling leaderboard draft in status open. */
export function newRollingLeaderboardDraft(code: string, title: string): RollingLeaderboardDraft {
  return new RollingLeaderboardDraft(code, title, "", 0, false, 0, 0, 0, "", 0, "", "open");
}
