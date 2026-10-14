/**
 * The path estimate records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path estimate is in its life cycle. */
export type PathEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a path estimate and its current status. */
export class PathEstimate {
  code: string;
  title: string;
  bid: number;
  timezone: string;
  durationMinutes: number;
  endsAt: number;
  startsAt: number;
  impressions: number;
  ceiling: number;
  cohort: string;
  channel: string;
  status: PathEstimateStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    timezone: string,
    durationMinutes: number,
    endsAt: number,
    startsAt: number,
    impressions: number,
    ceiling: number,
    cohort: string,
    channel: string,
    status: PathEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.timezone = timezone;
    this.durationMinutes = durationMinutes;
    this.endsAt = endsAt;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.ceiling = ceiling;
    this.cohort = cohort;
    this.channel = channel;
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

  canMoveTo(next: PathEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.impressions + this.endsAt) * 100) / 100;
  }

  copy(): PathEstimate {
    return new PathEstimate(
      this.code,
      this.title,
      this.bid,
      this.timezone,
      this.durationMinutes,
      this.endsAt,
      this.startsAt,
      this.impressions,
      this.ceiling,
      this.cohort,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a path estimate in status proposed. */
export function newPathEstimate(code: string, title: string): PathEstimate {
  return new PathEstimate(code, title, 0, "", 0, 0, 0, 0, 0, "", "", "proposed");
}
