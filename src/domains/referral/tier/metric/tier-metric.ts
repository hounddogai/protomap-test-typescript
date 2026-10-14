/**
 * The tier metric records of referral's tier work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tier metric is in its life cycle. */
export type TierMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** One tier metric, with what the planners need to act on it. */
export class TierMetric {
  code: string;
  label: string;
  country: string;
  ceiling: number;
  amount: number;
  variant: string;
  limit: number;
  version: number;
  score: number;
  summary: string;
  status: TierMetricStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    ceiling: number,
    amount: number,
    variant: string,
    limit: number,
    version: number,
    score: number,
    summary: string,
    status: TierMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.ceiling = ceiling;
    this.amount = amount;
    this.variant = variant;
    this.limit = limit;
    this.version = version;
    this.score = score;
    this.summary = summary;
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

  canMoveTo(next: TierMetricStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TierMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"tier metric"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.amount - this.version) * 100) / 100;
  }

  copy(): TierMetric {
    return new TierMetric(
      this.code,
      this.label,
      this.country,
      this.ceiling,
      this.amount,
      this.variant,
      this.limit,
      this.version,
      this.score,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tier metric in status new. */
export function newTierMetric(code: string, label: string): TierMetric {
  return new TierMetric(code, label, "", 0, 0, "", 0, 0, 0, "", "new");
}
