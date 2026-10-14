/**
 * The seasonal streak quota records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal streak quota is in its life cycle. */
export type SeasonalStreakQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal streak quota. Its code is unique within a tenant. */
export class SeasonalStreakQuota {
  code: string;
  label: string;
  segment: string;
  maximum: number;
  impressions: number;
  status: SeasonalStreakQuotaStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    maximum: number,
    impressions: number,
    status: SeasonalStreakQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.maximum = maximum;
    this.impressions = impressions;
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

  canMoveTo(next: SeasonalStreakQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalStreakQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal streak quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.maximum + this.impressions) * 100) / 100;
  }

  copy(): SeasonalStreakQuota {
    return new SeasonalStreakQuota(this.code, this.label, this.segment, this.maximum, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal streak quota in status idle. */
export function newSeasonalStreakQuota(code: string, label: string): SeasonalStreakQuota {
  return new SeasonalStreakQuota(code, label, "", 0, 0, "idle");
}
