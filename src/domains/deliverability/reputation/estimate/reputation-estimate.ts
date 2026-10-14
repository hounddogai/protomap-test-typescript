/**
 * The reputation estimate records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation estimate is in its life cycle. */
export type ReputationEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a reputation estimate and its current status. */
export class ReputationEstimate {
  code: string;
  title: string;
  weight: number;
  bid: number;
  maximum: number;
  status: ReputationEstimateStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    bid: number,
    maximum: number,
    status: ReputationEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.bid = bid;
    this.maximum = maximum;
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

  canMoveTo(next: ReputationEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
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

  moveTo(next: ReputationEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reputation estimate"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.maximum - this.weight) * 100) / 100;
  }

  copy(): ReputationEstimate {
    return new ReputationEstimate(this.code, this.title, this.weight, this.bid, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation estimate in status new. */
export function newReputationEstimate(code: string, title: string): ReputationEstimate {
  return new ReputationEstimate(code, title, 0, 0, 0, "new");
}
