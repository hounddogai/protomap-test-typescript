/**
 * The seasonal badge baseline records of loyaltyhub's badge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal badge baseline is in its life cycle. */
export type SeasonalBadgeBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal badge baseline. Its code is unique within a tenant. */
export class SeasonalBadgeBaseline {
  code: string;
  title: string;
  endsAt: number;
  impressions: number;
  openRate: number;
  createdAt: number;
  status: SeasonalBadgeBaselineStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    impressions: number,
    openRate: number,
    createdAt: number,
    status: SeasonalBadgeBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.openRate = openRate;
    this.createdAt = createdAt;
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

  canMoveTo(next: SeasonalBadgeBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalBadgeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal badge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round(this.endsAt * this.openRate * 100) / 100;
  }

  copy(): SeasonalBadgeBaseline {
    return new SeasonalBadgeBaseline(
      this.code,
      this.title,
      this.endsAt,
      this.impressions,
      this.openRate,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal badge baseline in status idle. */
export function newSeasonalBadgeBaseline(code: string, title: string): SeasonalBadgeBaseline {
  return new SeasonalBadgeBaseline(code, title, 0, 0, 0, 0, "idle");
}
