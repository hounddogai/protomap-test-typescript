/**
 * The seasonal badge profile records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal badge profile is in its life cycle. */
export type SeasonalBadgeProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a seasonal badge profile and its current status. */
export class SeasonalBadgeProfile {
  code: string;
  name: string;
  description: string;
  sendAt: number;
  startsAt: number;
  impressions: number;
  notes: string;
  status: SeasonalBadgeProfileStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    sendAt: number,
    startsAt: number,
    impressions: number,
    notes: string,
    status: SeasonalBadgeProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.sendAt = sendAt;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalBadgeProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalBadgeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal badge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.sendAt + this.startsAt) * 100) / 100;
  }

  copy(): SeasonalBadgeProfile {
    return new SeasonalBadgeProfile(
      this.code,
      this.name,
      this.description,
      this.sendAt,
      this.startsAt,
      this.impressions,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal badge profile in status idle. */
export function newSeasonalBadgeProfile(code: string, name: string): SeasonalBadgeProfile {
  return new SeasonalBadgeProfile(code, name, "", 0, 0, 0, "", "idle");
}
