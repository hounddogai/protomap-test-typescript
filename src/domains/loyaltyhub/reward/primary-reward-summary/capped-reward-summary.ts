/**
 * The capped reward summary records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped reward summary is in its life cycle. */
export type CappedRewardSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped reward summary. Its code is unique within a tenant. */
export class CappedRewardSummary {
  code: string;
  label: string;
  journeyId: string;
  floorValue: number;
  summary: string;
  conversionRate: number;
  region: string;
  status: CappedRewardSummaryStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    floorValue: number,
    summary: string,
    conversionRate: number,
    region: string,
    status: CappedRewardSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.floorValue = floorValue;
    this.summary = summary;
    this.conversionRate = conversionRate;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedRewardSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedRewardSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reward summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round((this.conversionRate + this.floorValue) * 100) / 100;
  }

  copy(): CappedRewardSummary {
    return new CappedRewardSummary(
      this.code,
      this.label,
      this.journeyId,
      this.floorValue,
      this.summary,
      this.conversionRate,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped reward summary in status new. */
export function newCappedRewardSummary(code: string, label: string): CappedRewardSummary {
  return new CappedRewardSummary(code, label, "", 0, "", 0, "", "new");
}
