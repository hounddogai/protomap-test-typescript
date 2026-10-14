import * as text from "../../../../kit/text.js";

/** Where a bid rule adjustment is in its life cycle. */
export type BidRuleAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One bid rule adjustment, with what the planners need to act on it. */
export class BidRuleAdjustment {
  code: string;
  name: string;
  conversionRate: number;
  category: string;
  segment: string;
  frequencyCap: number;
  status: BidRuleAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    category: string,
    segment: string,
    frequencyCap: number,
    status: BidRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.category = category;
    this.segment = segment;
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

  canMoveTo(next: BidRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "failed";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: BidRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.conversionRate - this.frequencyCap) * 100) / 100;
  }

  copy(): BidRuleAdjustment {
    return new BidRuleAdjustment(
      this.code,
      this.name,
      this.conversionRate,
      this.category,
      this.segment,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bid rule adjustment in status new. */
export function newBidRuleAdjustment(code: string, name: string): BidRuleAdjustment {
  return new BidRuleAdjustment(code, name, 0, "", "", 0, "new");
}
