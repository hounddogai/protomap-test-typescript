import * as text from "../../../../kit/text.js";

/** Where a bid rule mapping is in its life cycle. */
export type BidRuleMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A bid rule mapping as the bid rule team keeps it. */
export class BidRuleMapping {
  code: string;
  title: string;
  attempts: number;
  conversionRate: number;
  frequencyCap: number;
  ownerId: string;
  approved: boolean;
  segment: string;
  batchSize: number;
  status: BidRuleMappingStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    conversionRate: number,
    frequencyCap: number,
    ownerId: string,
    approved: boolean,
    segment: string,
    batchSize: number,
    status: BidRuleMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.conversionRate = conversionRate;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
    this.approved = approved;
    this.segment = segment;
    this.batchSize = batchSize;
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

  canMoveTo(next: BidRuleMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BidRuleMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.conversionRate - this.frequencyCap) * 100) / 100;
  }

  copy(): BidRuleMapping {
    return new BidRuleMapping(
      this.code,
      this.title,
      this.attempts,
      this.conversionRate,
      this.frequencyCap,
      this.ownerId,
      this.approved,
      this.segment,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a bid rule mapping in status draft. */
export function newBidRuleMapping(code: string, title: string): BidRuleMapping {
  return new BidRuleMapping(code, title, 0, 0, 0, "", false, "", 0, "draft");
}
