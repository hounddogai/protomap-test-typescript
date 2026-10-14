/**
 * The batched streak exception records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched streak exception is in its life cycle. */
export type BatchedStreakExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched streak exception as the streak team keeps it. */
export class BatchedStreakException {
  code: string;
  label: string;
  revision: number;
  clicks: number;
  margin: number;
  conversionRate: number;
  journeyId: string;
  threshold: number;
  status: BatchedStreakExceptionStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    clicks: number,
    margin: number,
    conversionRate: number,
    journeyId: string,
    threshold: number,
    status: BatchedStreakExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.clicks = clicks;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.journeyId = journeyId;
    this.threshold = threshold;
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

  canMoveTo(next: BatchedStreakExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "stopped":
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

  moveTo(next: BatchedStreakExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched streak exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"batched streak exception"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.clicks * this.revision * 100) / 100;
  }

  copy(): BatchedStreakException {
    return new BatchedStreakException(
      this.code,
      this.label,
      this.revision,
      this.clicks,
      this.margin,
      this.conversionRate,
      this.journeyId,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched streak exception in status idle. */
export function newBatchedStreakException(code: string, label: string): BatchedStreakException {
  return new BatchedStreakException(code, label, 0, 0, 0, 0, "", 0, "idle");
}
