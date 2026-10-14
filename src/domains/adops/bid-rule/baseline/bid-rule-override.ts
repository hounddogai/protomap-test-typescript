import * as text from "../../../../kit/text.js";

/** Where a bid rule override is in its life cycle. */
export type BidRuleOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A bid rule override as the bid rule team keeps it. */
export class BidRuleOverride {
  code: string;
  label: string;
  pinned: boolean;
  description: string;
  sendAt: number;
  floorValue: number;
  conversionRate: number;
  bid: number;
  maximum: number;
  status: BidRuleOverrideStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    description: string,
    sendAt: number,
    floorValue: number,
    conversionRate: number,
    bid: number,
    maximum: number,
    status: BidRuleOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.description = description;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.bid = bid;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"bid rule override"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.sendAt * this.conversionRate * 100) / 100;
  }

  copy(): BidRuleOverride {
    return new BidRuleOverride(
      this.code,
      this.label,
      this.pinned,
      this.description,
      this.sendAt,
      this.floorValue,
      this.conversionRate,
      this.bid,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bid rule override in status proposed. */
export function newBidRuleOverride(code: string, label: string): BidRuleOverride {
  return new BidRuleOverride(code, label, false, "", 0, 0, 0, 0, 0, "proposed");
}
