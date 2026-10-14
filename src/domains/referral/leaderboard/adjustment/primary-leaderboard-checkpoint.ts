import * as text from "../../../../kit/text.js";

/** Where a primary leaderboard checkpoint is in its life cycle. */
export type PrimaryLeaderboardCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a primary leaderboard checkpoint and its current status. */
export class PrimaryLeaderboardCheckpoint {
  code: string;
  label: string;
  unit: string;
  campaignRef: string;
  quantity: number;
  timezone: string;
  journeyId: string;
  limit: number;
  name: string;
  impressions: number;
  audienceId: string;
  status: PrimaryLeaderboardCheckpointStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    campaignRef: string,
    quantity: number,
    timezone: string,
    journeyId: string,
    limit: number,
    name: string,
    impressions: number,
    audienceId: string,
    status: PrimaryLeaderboardCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.timezone = timezone;
    this.journeyId = journeyId;
    this.limit = limit;
    this.name = name;
    this.impressions = impressions;
    this.audienceId = audienceId;
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

  canMoveTo(next: PrimaryLeaderboardCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryLeaderboardCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary leaderboard checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.quantity - this.impressions) * 100) / 100;
  }

  copy(): PrimaryLeaderboardCheckpoint {
    return new PrimaryLeaderboardCheckpoint(
      this.code,
      this.label,
      this.unit,
      this.campaignRef,
      this.quantity,
      this.timezone,
      this.journeyId,
      this.limit,
      this.name,
      this.impressions,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary leaderboard checkpoint in status proposed. */
export function newPrimaryLeaderboardCheckpoint(code: string, label: string): PrimaryLeaderboardCheckpoint {
  return new PrimaryLeaderboardCheckpoint(code, label, "", "", 0, "", "", 0, "", 0, "", "proposed");
}
