/**
 * The bid rule metric records of adops's bid rule work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule metric is in its life cycle. */
export type BidRuleMetricStatus = "created" | "validated" | "published" | "retired";

/** The record of a bid rule metric and its current status. */
export class BidRuleMetric {
  code: string;
  name: string;
  quantity: number;
  weight: number;
  checksum: string;
  status: BidRuleMetricStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    weight: number,
    checksum: string,
    status: BidRuleMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.weight = weight;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleMetricStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BidRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round((this.quantity - this.weight) * 100) / 100;
  }

  copy(): BidRuleMetric {
    return new BidRuleMetric(this.code, this.name, this.quantity, this.weight, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a bid rule metric in status created. */
export function newBidRuleMetric(code: string, name: string): BidRuleMetric {
  return new BidRuleMetric(code, name, 0, 0, "", "created");
}
