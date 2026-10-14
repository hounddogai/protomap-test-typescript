/**
 * The bid rule policy records of adops's bid rule work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule policy is in its life cycle. */
export type BidRulePolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a bid rule policy and its current status. */
export class BidRulePolicy {
  code: string;
  title: string;
  capacity: number;
  revision: number;
  frequencyCap: number;
  category: string;
  sendAt: number;
  currency: string;
  version: number;
  checksum: string;
  cohort: string;
  status: BidRulePolicyStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    revision: number,
    frequencyCap: number,
    category: string,
    sendAt: number,
    currency: string,
    version: number,
    checksum: string,
    cohort: string,
    status: BidRulePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.sendAt = sendAt;
    this.currency = currency;
    this.version = version;
    this.checksum = checksum;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRulePolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRulePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedExposure(): number {
    return Math.round(this.version * this.revision * 100) / 100;
  }

  copy(): BidRulePolicy {
    return new BidRulePolicy(
      this.code,
      this.title,
      this.capacity,
      this.revision,
      this.frequencyCap,
      this.category,
      this.sendAt,
      this.currency,
      this.version,
      this.checksum,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a bid rule policy in status planned. */
export function newBidRulePolicy(code: string, title: string): BidRulePolicy {
  return new BidRulePolicy(code, title, 0, 0, 0, "", 0, "", 0, "", "", "planned");
}
