import * as text from "../../../../kit/text.js";

/** Where a bid rule estimate is in its life cycle. */
export type BidRuleEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a bid rule estimate and its current status. */
export class BidRuleEstimate {
  code: string;
  name: string;
  conversionRate: number;
  amount: number;
  summary: string;
  version: number;
  journeyId: string;
  externalRef: string;
  status: BidRuleEstimateStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    amount: number,
    summary: string,
    version: number,
    journeyId: string,
    externalRef: string,
    status: BidRuleEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.amount = amount;
    this.summary = summary;
    this.version = version;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round(this.amount * this.version * 100) / 100;
  }

  copy(): BidRuleEstimate {
    return new BidRuleEstimate(
      this.code,
      this.name,
      this.conversionRate,
      this.amount,
      this.summary,
      this.version,
      this.journeyId,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bid rule estimate in status requested. */
export function newBidRuleEstimate(code: string, name: string): BidRuleEstimate {
  return new BidRuleEstimate(code, name, 0, 0, "", 0, "", "", "requested");
}
