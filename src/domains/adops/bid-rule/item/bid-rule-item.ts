/**
 * The bid rule item records of adops's bid rule work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule item is in its life cycle. */
export type BidRuleItemStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A bid rule item as the bid rule team keeps it. */
export class BidRuleItem {
  code: string;
  title: string;
  windowDays: number;
  conversionRate: number;
  bid: number;
  expiresAt: number;
  discount: number;
  priority: number;
  status: BidRuleItemStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    conversionRate: number,
    bid: number,
    expiresAt: number,
    discount: number,
    priority: number,
    status: BidRuleItemStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.conversionRate = conversionRate;
    this.bid = bid;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.priority = priority;
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

  canMoveTo(next: BidRuleItemStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BidRuleItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round(this.priority * this.expiresAt * 100) / 100;
  }

  copy(): BidRuleItem {
    return new BidRuleItem(
      this.code,
      this.title,
      this.windowDays,
      this.conversionRate,
      this.bid,
      this.expiresAt,
      this.discount,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bid rule item in status proposed. */
export function newBidRuleItem(code: string, title: string): BidRuleItem {
  return new BidRuleItem(code, title, 0, 0, 0, 0, 0, 0, "proposed");
}
