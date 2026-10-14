/**
 * The leaderboard snapshot records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard snapshot is in its life cycle. */
export type LeaderboardSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A leaderboard snapshot. Its code is unique within a tenant. */
export class LeaderboardSnapshot {
  code: string;
  name: string;
  campaignRef: string;
  reviewer: string;
  quantity: number;
  impressions: number;
  active: boolean;
  priority: number;
  checksum: string;
  label: string;
  openRate: number;
  status: LeaderboardSnapshotStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    reviewer: string,
    quantity: number,
    impressions: number,
    active: boolean,
    priority: number,
    checksum: string,
    label: string,
    openRate: number,
    status: LeaderboardSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.impressions = impressions;
    this.active = active;
    this.priority = priority;
    this.checksum = checksum;
    this.label = label;
    this.openRate = openRate;
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

  canMoveTo(next: LeaderboardSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
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

  moveTo(next: LeaderboardSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"leaderboard snapshot"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.impressions * this.priority * 100) / 100;
  }

  copy(): LeaderboardSnapshot {
    return new LeaderboardSnapshot(
      this.code,
      this.name,
      this.campaignRef,
      this.reviewer,
      this.quantity,
      this.impressions,
      this.active,
      this.priority,
      this.checksum,
      this.label,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a leaderboard snapshot in status proposed. */
export function newLeaderboardSnapshot(code: string, name: string): LeaderboardSnapshot {
  return new LeaderboardSnapshot(code, name, "", "", 0, 0, false, 0, "", "", 0, "proposed");
}
