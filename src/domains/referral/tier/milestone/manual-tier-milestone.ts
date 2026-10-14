/**
 * The manual tier milestone records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual tier milestone is in its life cycle. */
export type ManualTierMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One manual tier milestone, with what the planners need to act on it. */
export class ManualTierMilestone {
  code: string;
  title: string;
  capacity: number;
  maximum: number;
  score: number;
  status: ManualTierMilestoneStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    maximum: number,
    score: number,
    status: ManualTierMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.maximum = maximum;
    this.score = score;
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

  canMoveTo(next: ManualTierMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualTierMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.maximum - this.capacity) * 100) / 100;
  }

  copy(): ManualTierMilestone {
    return new ManualTierMilestone(this.code, this.title, this.capacity, this.maximum, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual tier milestone in status idle. */
export function newManualTierMilestone(code: string, title: string): ManualTierMilestone {
  return new ManualTierMilestone(code, title, 0, 0, 0, "idle");
}
