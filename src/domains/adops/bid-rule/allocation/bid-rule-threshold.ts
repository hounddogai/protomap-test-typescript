import * as text from "../../../../kit/text.js";

/** Where a bid rule threshold is in its life cycle. */
export type BidRuleThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a bid rule threshold and its current status. */
export class BidRuleThreshold {
  code: string;
  title: string;
  amount: number;
  cost: number;
  threshold: number;
  campaignRef: string;
  name: string;
  category: string;
  retries: number;
  checksum: string;
  updatedAt: number;
  status: BidRuleThresholdStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    cost: number,
    threshold: number,
    campaignRef: string,
    name: string,
    category: string,
    retries: number,
    checksum: string,
    updatedAt: number,
    status: BidRuleThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.cost = cost;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.name = name;
    this.category = category;
    this.retries = retries;
    this.checksum = checksum;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: BidRuleThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BidRuleThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"bid rule threshold"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.updatedAt - this.amount) * 100) / 100;
  }

  copy(): BidRuleThreshold {
    return new BidRuleThreshold(
      this.code,
      this.title,
      this.amount,
      this.cost,
      this.threshold,
      this.campaignRef,
      this.name,
      this.category,
      this.retries,
      this.checksum,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bid rule threshold in status idle. */
export function newBidRuleThreshold(code: string, title: string): BidRuleThreshold {
  return new BidRuleThreshold(code, title, 0, 0, 0, "", "", "", 0, "", 0, "idle");
}
