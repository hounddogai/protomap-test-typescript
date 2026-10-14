/**
 * The leaderboard slot records of referral's leaderboard work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard slot is in its life cycle. */
export type LeaderboardSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a leaderboard slot and its current status. */
export class LeaderboardSlot {
  code: string;
  name: string;
  impressions: number;
  createdAt: number;
  ratio: number;
  ownerId: string;
  archived: boolean;
  source: string;
  audienceId: string;
  updatedAt: number;
  batchSize: number;
  status: LeaderboardSlotStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    createdAt: number,
    ratio: number,
    ownerId: string,
    archived: boolean,
    source: string,
    audienceId: string,
    updatedAt: number,
    batchSize: number,
    status: LeaderboardSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.createdAt = createdAt;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.archived = archived;
    this.source = source;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
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

  canMoveTo(next: LeaderboardSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LeaderboardSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.updatedAt - this.createdAt) * 100) / 100;
  }

  copy(): LeaderboardSlot {
    return new LeaderboardSlot(
      this.code,
      this.name,
      this.impressions,
      this.createdAt,
      this.ratio,
      this.ownerId,
      this.archived,
      this.source,
      this.audienceId,
      this.updatedAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a leaderboard slot in status open. */
export function newLeaderboardSlot(code: string, name: string): LeaderboardSlot {
  return new LeaderboardSlot(code, name, 0, 0, 0, "", false, "", "", 0, 0, "open");
}
