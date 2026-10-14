import * as text from "../../../../kit/text.js";

/** Where a bid rule rollup is in its life cycle. */
export type BidRuleRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A bid rule rollup as the bid rule team keeps it. */
export class BidRuleRollup {
  code: string;
  label: string;
  minimum: number;
  revision: number;
  discount: number;
  reviewer: string;
  endsAt: number;
  score: number;
  category: string;
  status: BidRuleRollupStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    revision: number,
    discount: number,
    reviewer: string,
    endsAt: number,
    score: number,
    category: string,
    status: BidRuleRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.revision = revision;
    this.discount = discount;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.score = score;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.discount + this.endsAt) * 100) / 100;
  }

  copy(): BidRuleRollup {
    return new BidRuleRollup(
      this.code,
      this.label,
      this.minimum,
      this.revision,
      this.discount,
      this.reviewer,
      this.endsAt,
      this.score,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bid rule rollup in status draft. */
export function newBidRuleRollup(code: string, label: string): BidRuleRollup {
  return new BidRuleRollup(code, label, 0, 0, 0, "", 0, 0, "", "draft");
}
