import * as text from "../../../../kit/text.js";

/** Where a leaderboard preference is in its life cycle. */
export type LeaderboardPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A leaderboard preference. Its code is unique within a tenant. */
export class LeaderboardPreference {
  code: string;
  label: string;
  cost: number;
  weight: number;
  reviewer: string;
  externalRef: string;
  startsAt: number;
  locale: string;
  region: string;
  timezone: string;
  status: LeaderboardPreferenceStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    weight: number,
    reviewer: string,
    externalRef: string,
    startsAt: number,
    locale: string,
    region: string,
    timezone: string,
    status: LeaderboardPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.weight = weight;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.startsAt = startsAt;
    this.locale = locale;
    this.region = region;
    this.timezone = timezone;
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

  canMoveTo(next: LeaderboardPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LeaderboardPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netValue(): number {
    return Math.round((this.startsAt - this.cost) * 100) / 100;
  }

  copy(): LeaderboardPreference {
    return new LeaderboardPreference(
      this.code,
      this.label,
      this.cost,
      this.weight,
      this.reviewer,
      this.externalRef,
      this.startsAt,
      this.locale,
      this.region,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a leaderboard preference in status open. */
export function newLeaderboardPreference(code: string, label: string): LeaderboardPreference {
  return new LeaderboardPreference(code, label, 0, 0, "", "", 0, "", "", "", "open");
}
