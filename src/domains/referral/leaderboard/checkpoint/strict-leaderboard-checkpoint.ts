/**
 * The strict leaderboard checkpoint records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict leaderboard checkpoint is in its life cycle. */
export type StrictLeaderboardCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict leaderboard checkpoint and its current status. */
export class StrictLeaderboardCheckpoint {
  code: string;
  label: string;
  attributes: Map<string, string>;
  unit: string;
  timezone: string;
  createdAt: number;
  frequencyCap: number;
  openRate: number;
  locale: string;
  approved: boolean;
  attempts: number;
  status: StrictLeaderboardCheckpointStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    unit: string,
    timezone: string,
    createdAt: number,
    frequencyCap: number,
    openRate: number,
    locale: string,
    approved: boolean,
    attempts: number,
    status: StrictLeaderboardCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.unit = unit;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.locale = locale;
    this.approved = approved;
    this.attempts = attempts;
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

  canMoveTo(next: StrictLeaderboardCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictLeaderboardCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict leaderboard checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedValue(): number {
    return Math.round(this.openRate * this.attempts * 100) / 100;
  }

  copy(): StrictLeaderboardCheckpoint {
    return new StrictLeaderboardCheckpoint(
      this.code,
      this.label,
      this.attributes,
      this.unit,
      this.timezone,
      this.createdAt,
      this.frequencyCap,
      this.openRate,
      this.locale,
      this.approved,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a strict leaderboard checkpoint in status new. */
export function newStrictLeaderboardCheckpoint(code: string, label: string): StrictLeaderboardCheckpoint {
  return new StrictLeaderboardCheckpoint(code, label, new Map<string, string>(), "", "", 0, 0, 0, "", false, 0, "new");
}
