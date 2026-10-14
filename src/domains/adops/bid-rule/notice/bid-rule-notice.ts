/**
 * The bid rule notice records of adops's bid rule work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule notice is in its life cycle. */
export type BidRuleNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A bid rule notice. Its code is unique within a tenant. */
export class BidRuleNotice {
  code: string;
  title: string;
  visible: boolean;
  durationMinutes: number;
  label: string;
  category: string;
  frequencyCap: number;
  graceDays: number;
  bid: number;
  status: BidRuleNoticeStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    durationMinutes: number,
    label: string,
    category: string,
    frequencyCap: number,
    graceDays: number,
    bid: number,
    status: BidRuleNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.durationMinutes = durationMinutes;
    this.label = label;
    this.category = category;
    this.frequencyCap = frequencyCap;
    this.graceDays = graceDays;
    this.bid = bid;
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

  canMoveTo(next: BidRuleNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: BidRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.durationMinutes + this.graceDays) * 100) / 100;
  }

  copy(): BidRuleNotice {
    return new BidRuleNotice(
      this.code,
      this.title,
      this.visible,
      this.durationMinutes,
      this.label,
      this.category,
      this.frequencyCap,
      this.graceDays,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bid rule notice in status proposed. */
export function newBidRuleNotice(code: string, title: string): BidRuleNotice {
  return new BidRuleNotice(code, title, false, 0, "", "", 0, 0, 0, "proposed");
}
