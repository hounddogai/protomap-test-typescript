import * as text from "../../../../kit/text.js";

/** Where a bid rule request is in its life cycle. */
export type BidRuleRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One bid rule request, with what the planners need to act on it. */
export class BidRuleRequest {
  code: string;
  label: string;
  approved: boolean;
  score: number;
  impressions: number;
  frequencyCap: number;
  status: BidRuleRequestStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    score: number,
    impressions: number,
    frequencyCap: number,
    status: BidRuleRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.score = score;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: BidRuleRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BidRuleRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.score + this.impressions) * 100) / 100;
  }

  copy(): BidRuleRequest {
    return new BidRuleRequest(
      this.code,
      this.label,
      this.approved,
      this.score,
      this.impressions,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule request in status new. */
export function newBidRuleRequest(code: string, label: string): BidRuleRequest {
  return new BidRuleRequest(code, label, false, 0, 0, 0, "new");
}
