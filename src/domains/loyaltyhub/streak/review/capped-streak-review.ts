/**
 * The capped streak review records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped streak review is in its life cycle. */
export type CappedStreakReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped streak review as the streak team keeps it. */
export class CappedStreakReview {
  code: string;
  label: string;
  graceDays: number;
  version: number;
  audienceId: string;
  discount: number;
  updatedAt: number;
  journeyId: string;
  status: CappedStreakReviewStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    version: number,
    audienceId: string,
    discount: number,
    updatedAt: number,
    journeyId: string,
    status: CappedStreakReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.version = version;
    this.audienceId = audienceId;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
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

  canMoveTo(next: CappedStreakReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedStreakReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped streak review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round(this.graceDays * this.discount * 100) / 100;
  }

  copy(): CappedStreakReview {
    return new CappedStreakReview(
      this.code,
      this.label,
      this.graceDays,
      this.version,
      this.audienceId,
      this.discount,
      this.updatedAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped streak review in status idle. */
export function newCappedStreakReview(code: string, label: string): CappedStreakReview {
  return new CappedStreakReview(code, label, 0, 0, "", 0, 0, "", "idle");
}
