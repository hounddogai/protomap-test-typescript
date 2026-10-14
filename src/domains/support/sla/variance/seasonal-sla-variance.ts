/**
 * The seasonal sla variance records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal sla variance is in its life cycle. */
export type SeasonalSlaVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** One seasonal sla variance, with what the planners need to act on it. */
export class SeasonalSlaVariance {
  code: string;
  name: string;
  budget: number;
  channel: string;
  timezone: string;
  updatedAt: number;
  status: SeasonalSlaVarianceStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    channel: string,
    timezone: string,
    updatedAt: number,
    status: SeasonalSlaVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.channel = channel;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: SeasonalSlaVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSlaVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal sla variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"seasonal sla variance"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.budget * this.updatedAt * 100) / 100;
  }

  copy(): SeasonalSlaVariance {
    return new SeasonalSlaVariance(
      this.code,
      this.name,
      this.budget,
      this.channel,
      this.timezone,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal sla variance in status requested. */
export function newSeasonalSlaVariance(code: string, name: string): SeasonalSlaVariance {
  return new SeasonalSlaVariance(code, name, 0, "", "", 0, "requested");
}
