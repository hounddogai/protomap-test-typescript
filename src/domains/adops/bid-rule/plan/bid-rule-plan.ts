/**
 * The bid rule plan records of adops's bid rule work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bid rule plan is in its life cycle. */
export type BidRulePlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A bid rule plan. Its code is unique within a tenant. */
export class BidRulePlan {
  code: string;
  name: string;
  contactEmail: string;
  windowDays: number;
  margin: number;
  unit: string;
  status: BidRulePlanStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    windowDays: number,
    margin: number,
    unit: string,
    status: BidRulePlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.windowDays = windowDays;
    this.margin = margin;
    this.unit = unit;
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

  canMoveTo(next: BidRulePlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BidRulePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"bid rule plan"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.margin - this.windowDays) * 100) / 100;
  }

  copy(): BidRulePlan {
    return new BidRulePlan(
      this.code,
      this.name,
      this.contactEmail,
      this.windowDays,
      this.margin,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a bid rule plan in status planned. */
export function newBidRulePlan(code: string, name: string): BidRulePlan {
  return new BidRulePlan(code, name, "", 0, 0, "", "planned");
}
