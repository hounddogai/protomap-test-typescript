/**
 * The bid rule allocation records of adops's bid rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule allocation is in its life cycle. */
export type BidRuleAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One bid rule allocation, with what the planners need to act on it. */
export class BidRuleAllocation {
  code: string;
  title: string;
  bid: number;
  visible: boolean;
  phone: string;
  budget: number;
  updatedAt: number;
  status: BidRuleAllocationStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    visible: boolean,
    phone: string,
    budget: number,
    updatedAt: number,
    status: BidRuleAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.visible = visible;
    this.phone = phone;
    this.budget = budget;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: BidRuleAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BidRuleAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"bid rule allocation"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.budget * this.updatedAt * 100) / 100;
  }

  copy(): BidRuleAllocation {
    return new BidRuleAllocation(
      this.code,
      this.title,
      this.bid,
      this.visible,
      this.phone,
      this.budget,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bid rule allocation in status open. */
export function newBidRuleAllocation(code: string, title: string): BidRuleAllocation {
  return new BidRuleAllocation(code, title, 0, false, "", 0, 0, "open");
}
