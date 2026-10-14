import * as text from "../../../../kit/text.js";

/** Where a manual bid rule estimate is in its life cycle. */
export type ManualBidRuleEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual bid rule estimate as the bid rule team keeps it. */
export class ManualBidRuleEstimate {
  code: string;
  title: string;
  openRate: number;
  attempts: number;
  score: number;
  status: ManualBidRuleEstimateStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    attempts: number,
    score: number,
    status: ManualBidRuleEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.attempts = attempts;
    this.score = score;
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

  canMoveTo(next: ManualBidRuleEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualBidRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bid rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.openRate - this.attempts) * 100) / 100;
  }

  copy(): ManualBidRuleEstimate {
    return new ManualBidRuleEstimate(this.code, this.title, this.openRate, this.attempts, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual bid rule estimate in status new. */
export function newManualBidRuleEstimate(code: string, title: string): ManualBidRuleEstimate {
  return new ManualBidRuleEstimate(code, title, 0, 0, 0, "new");
}
