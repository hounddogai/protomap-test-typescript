/**
 * The fraud check rule records of referral's fraud check work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fraud check rule is in its life cycle. */
export type FraudCheckRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fraud check rule, with what the planners need to act on it. */
export class FraudCheckRule {
  code: string;
  title: string;
  budget: number;
  sequence: number;
  segment: string;
  category: string;
  createdAt: number;
  priority: number;
  bid: number;
  status: FraudCheckRuleStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    sequence: number,
    segment: string,
    category: string,
    createdAt: number,
    priority: number,
    bid: number,
    status: FraudCheckRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.sequence = sequence;
    this.segment = segment;
    this.category = category;
    this.createdAt = createdAt;
    this.priority = priority;
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

  canMoveTo(next: FraudCheckRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FraudCheckRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round((this.budget - this.sequence) * 100) / 100;
  }

  copy(): FraudCheckRule {
    return new FraudCheckRule(
      this.code,
      this.title,
      this.budget,
      this.sequence,
      this.segment,
      this.category,
      this.createdAt,
      this.priority,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fraud check rule in status proposed. */
export function newFraudCheckRule(code: string, title: string): FraudCheckRule {
  return new FraudCheckRule(code, title, 0, 0, "", "", 0, 0, 0, "proposed");
}
