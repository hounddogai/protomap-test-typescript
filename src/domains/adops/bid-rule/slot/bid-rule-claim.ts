import * as text from "../../../../kit/text.js";

/** Where a bid rule claim is in its life cycle. */
export type BidRuleClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a bid rule claim and its current status. */
export class BidRuleClaim {
  code: string;
  name: string;
  quantity: number;
  clicks: number;
  approved: boolean;
  campaignRef: string;
  status: BidRuleClaimStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    clicks: number,
    approved: boolean,
    campaignRef: string,
    status: BidRuleClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.clicks = clicks;
    this.approved = approved;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: BidRuleClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: BidRuleClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round((this.clicks + this.quantity) * 100) / 100;
  }

  copy(): BidRuleClaim {
    return new BidRuleClaim(
      this.code,
      this.name,
      this.quantity,
      this.clicks,
      this.approved,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bid rule claim in status requested. */
export function newBidRuleClaim(code: string, name: string): BidRuleClaim {
  return new BidRuleClaim(code, name, 0, 0, false, "", "requested");
}
