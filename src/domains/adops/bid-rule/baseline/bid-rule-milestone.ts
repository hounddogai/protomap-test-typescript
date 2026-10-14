import * as text from "../../../../kit/text.js";

/** Where a bid rule milestone is in its life cycle. */
export type BidRuleMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A bid rule milestone. Its code is unique within a tenant. */
export class BidRuleMilestone {
  code: string;
  label: string;
  reviewer: string;
  score: number;
  checksum: string;
  openRate: number;
  maximum: number;
  discount: number;
  status: BidRuleMilestoneStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    score: number,
    checksum: string,
    openRate: number,
    maximum: number,
    discount: number,
    status: BidRuleMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.score = score;
    this.checksum = checksum;
    this.openRate = openRate;
    this.maximum = maximum;
    this.discount = discount;
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

  canMoveTo(next: BidRuleMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"bid rule milestone"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.discount + this.openRate) * 100) / 100;
  }

  copy(): BidRuleMilestone {
    return new BidRuleMilestone(
      this.code,
      this.label,
      this.reviewer,
      this.score,
      this.checksum,
      this.openRate,
      this.maximum,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule milestone in status open. */
export function newBidRuleMilestone(code: string, label: string): BidRuleMilestone {
  return new BidRuleMilestone(code, label, "", 0, "", 0, 0, 0, "open");
}
