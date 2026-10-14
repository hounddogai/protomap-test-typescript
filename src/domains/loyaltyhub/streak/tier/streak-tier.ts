/**
 * The streak tier records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak tier is in its life cycle. */
export type StreakTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a streak tier and its current status. */
export class StreakTier {
  code: string;
  title: string;
  frequencyCap: number;
  impressions: number;
  channel: string;
  ceiling: number;
  cost: number;
  archived: boolean;
  status: StreakTierStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    impressions: number,
    channel: string,
    ceiling: number,
    cost: number,
    archived: boolean,
    status: StreakTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.impressions = impressions;
    this.channel = channel;
    this.ceiling = ceiling;
    this.cost = cost;
    this.archived = archived;
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

  canMoveTo(next: StreakTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: StreakTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"streak tier"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.frequencyCap - this.cost) * 100) / 100;
  }

  copy(): StreakTier {
    return new StreakTier(
      this.code,
      this.title,
      this.frequencyCap,
      this.impressions,
      this.channel,
      this.ceiling,
      this.cost,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a streak tier in status proposed. */
export function newStreakTier(code: string, title: string): StreakTier {
  return new StreakTier(code, title, 0, 0, "", 0, 0, false, "proposed");
}
