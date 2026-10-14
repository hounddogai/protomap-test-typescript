import * as text from "../../../../kit/text.js";

/** Where a leaderboard digest is in its life cycle. */
export type LeaderboardDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a leaderboard digest and its current status. */
export class LeaderboardDigest {
  code: string;
  name: string;
  archived: boolean;
  durationMinutes: number;
  campaignRef: string;
  variant: string;
  floorValue: number;
  segment: string;
  journeyId: string;
  windowDays: number;
  status: LeaderboardDigestStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    durationMinutes: number,
    campaignRef: string,
    variant: string,
    floorValue: number,
    segment: string,
    journeyId: string,
    windowDays: number,
    status: LeaderboardDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.variant = variant;
    this.floorValue = floorValue;
    this.segment = segment;
    this.journeyId = journeyId;
    this.windowDays = windowDays;
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

  canMoveTo(next: LeaderboardDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.floorValue + this.windowDays) * 100) / 100;
  }

  copy(): LeaderboardDigest {
    return new LeaderboardDigest(
      this.code,
      this.name,
      this.archived,
      this.durationMinutes,
      this.campaignRef,
      this.variant,
      this.floorValue,
      this.segment,
      this.journeyId,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a leaderboard digest in status planned. */
export function newLeaderboardDigest(code: string, name: string): LeaderboardDigest {
  return new LeaderboardDigest(code, name, false, 0, "", "", 0, "", "", 0, "planned");
}
