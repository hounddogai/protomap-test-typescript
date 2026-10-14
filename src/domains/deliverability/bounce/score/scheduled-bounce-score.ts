/**
 * The scheduled bounce score records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled bounce score is in its life cycle. */
export type ScheduledBounceScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One scheduled bounce score, with what the planners need to act on it. */
export class ScheduledBounceScore {
  code: string;
  title: string;
  category: string;
  pinned: boolean;
  threshold: number;
  createdAt: number;
  status: ScheduledBounceScoreStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    pinned: boolean,
    threshold: number,
    createdAt: number,
    status: ScheduledBounceScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.pinned = pinned;
    this.threshold = threshold;
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

  canMoveTo(next: ScheduledBounceScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledBounceScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled bounce score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled bounce score"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.threshold - this.createdAt) * 100) / 100;
  }

  copy(): ScheduledBounceScore {
    return new ScheduledBounceScore(
      this.code,
      this.title,
      this.category,
      this.pinned,
      this.threshold,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled bounce score in status idle. */
export function newScheduledBounceScore(code: string, title: string): ScheduledBounceScore {
  return new ScheduledBounceScore(code, title, "", false, 0, 0, "idle");
}
