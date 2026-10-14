/**
 * The global reward estimate records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global reward estimate is in its life cycle. */
export type GlobalRewardEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global reward estimate. Its code is unique within a tenant. */
export class GlobalRewardEstimate {
  code: string;
  title: string;
  batchSize: number;
  threshold: number;
  variant: string;
  floorValue: number;
  minimum: number;
  summary: string;
  status: GlobalRewardEstimateStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    threshold: number,
    variant: string,
    floorValue: number,
    minimum: number,
    summary: string,
    status: GlobalRewardEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.threshold = threshold;
    this.variant = variant;
    this.floorValue = floorValue;
    this.minimum = minimum;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalRewardEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRewardEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.batchSize - this.threshold) * 100) / 100;
  }

  copy(): GlobalRewardEstimate {
    return new GlobalRewardEstimate(
      this.code,
      this.title,
      this.batchSize,
      this.threshold,
      this.variant,
      this.floorValue,
      this.minimum,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global reward estimate in status open. */
export function newGlobalRewardEstimate(code: string, title: string): GlobalRewardEstimate {
  return new GlobalRewardEstimate(code, title, 0, 0, "", 0, 0, "", "open");
}
