/**
 * The rolling subscription score records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling subscription score is in its life cycle. */
export type RollingSubscriptionScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One rolling subscription score, with what the planners need to act on it. */
export class RollingSubscriptionScore {
  code: string;
  title: string;
  graceDays: number;
  weight: number;
  notes: string;
  clicks: number;
  status: RollingSubscriptionScoreStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    weight: number,
    notes: string,
    clicks: number,
    status: RollingSubscriptionScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.weight = weight;
    this.notes = notes;
    this.clicks = clicks;
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

  canMoveTo(next: RollingSubscriptionScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingSubscriptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling subscription score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round(this.graceDays * this.weight * 100) / 100;
  }

  copy(): RollingSubscriptionScore {
    return new RollingSubscriptionScore(
      this.code,
      this.title,
      this.graceDays,
      this.weight,
      this.notes,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling subscription score in status idle. */
export function newRollingSubscriptionScore(code: string, title: string): RollingSubscriptionScore {
  return new RollingSubscriptionScore(code, title, 0, 0, "", 0, "idle");
}
