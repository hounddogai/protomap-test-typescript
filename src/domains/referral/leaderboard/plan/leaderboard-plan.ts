/**
 * The leaderboard plan records of referral's leaderboard work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard plan is in its life cycle. */
export type LeaderboardPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a leaderboard plan and its current status. */
export class LeaderboardPlan {
  code: string;
  label: string;
  attributes: Map<string, string>;
  campaignRef: string;
  durationMinutes: number;
  source: string;
  retries: number;
  limit: number;
  unit: string;
  status: LeaderboardPlanStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    campaignRef: string,
    durationMinutes: number,
    source: string,
    retries: number,
    limit: number,
    unit: string,
    status: LeaderboardPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.campaignRef = campaignRef;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.retries = retries;
    this.limit = limit;
    this.unit = unit;
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

  canMoveTo(next: LeaderboardPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.limit * this.durationMinutes * 100) / 100;
  }

  copy(): LeaderboardPlan {
    return new LeaderboardPlan(
      this.code,
      this.label,
      this.attributes,
      this.campaignRef,
      this.durationMinutes,
      this.source,
      this.retries,
      this.limit,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a leaderboard plan in status idle. */
export function newLeaderboardPlan(code: string, label: string): LeaderboardPlan {
  return new LeaderboardPlan(code, label, new Map<string, string>(), "", 0, "", 0, 0, "", "idle");
}
