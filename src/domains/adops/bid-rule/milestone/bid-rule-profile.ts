import * as text from "../../../../kit/text.js";

/** Where a bid rule profile is in its life cycle. */
export type BidRuleProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A bid rule profile. Its code is unique within a tenant. */
export class BidRuleProfile {
  code: string;
  label: string;
  bid: number;
  batchSize: number;
  country: string;
  locale: string;
  approved: boolean;
  unit: string;
  sendAt: number;
  status: BidRuleProfileStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    batchSize: number,
    country: string,
    locale: string,
    approved: boolean,
    unit: string,
    sendAt: number,
    status: BidRuleProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.batchSize = batchSize;
    this.country = country;
    this.locale = locale;
    this.approved = approved;
    this.unit = unit;
    this.sendAt = sendAt;
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

  canMoveTo(next: BidRuleProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BidRuleProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round((this.bid - this.batchSize) * 100) / 100;
  }

  copy(): BidRuleProfile {
    return new BidRuleProfile(
      this.code,
      this.label,
      this.bid,
      this.batchSize,
      this.country,
      this.locale,
      this.approved,
      this.unit,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a bid rule profile in status draft. */
export function newBidRuleProfile(code: string, label: string): BidRuleProfile {
  return new BidRuleProfile(code, label, 0, 0, "", "", false, "", 0, "draft");
}
