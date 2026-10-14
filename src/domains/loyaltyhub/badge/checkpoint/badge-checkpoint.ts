/**
 * The badge checkpoint records of loyaltyhub's badge work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge checkpoint is in its life cycle. */
export type BadgeCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a badge checkpoint and its current status. */
export class BadgeCheckpoint {
  code: string;
  name: string;
  archived: boolean;
  impressions: number;
  retries: number;
  openRate: number;
  endsAt: number;
  graceDays: number;
  timezone: string;
  bid: number;
  status: BadgeCheckpointStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    impressions: number,
    retries: number,
    openRate: number,
    endsAt: number,
    graceDays: number,
    timezone: string,
    bid: number,
    status: BadgeCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.impressions = impressions;
    this.retries = retries;
    this.openRate = openRate;
    this.endsAt = endsAt;
    this.graceDays = graceDays;
    this.timezone = timezone;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BadgeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.graceDays - this.endsAt) * 100) / 100;
  }

  copy(): BadgeCheckpoint {
    return new BadgeCheckpoint(
      this.code,
      this.name,
      this.archived,
      this.impressions,
      this.retries,
      this.openRate,
      this.endsAt,
      this.graceDays,
      this.timezone,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge checkpoint in status requested. */
export function newBadgeCheckpoint(code: string, name: string): BadgeCheckpoint {
  return new BadgeCheckpoint(code, name, false, 0, 0, 0, 0, 0, "", 0, "requested");
}
