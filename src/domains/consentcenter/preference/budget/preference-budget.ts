/**
 * The preference budget records of consentcenter's preference work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a preference budget is in its life cycle. */
export type PreferenceBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One preference budget, with what the planners need to act on it. */
export class PreferenceBudget {
  code: string;
  title: string;
  priority: number;
  locale: string;
  currency: string;
  sendAt: number;
  reviewer: string;
  cohort: string;
  bid: number;
  source: string;
  status: PreferenceBudgetStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    locale: string,
    currency: string,
    sendAt: number,
    reviewer: string,
    cohort: string,
    bid: number,
    source: string,
    status: PreferenceBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.locale = locale;
    this.currency = currency;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.bid = bid;
    this.source = source;
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

  canMoveTo(next: PreferenceBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PreferenceBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"preference budget"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.sendAt * this.priority * 100) / 100;
  }

  copy(): PreferenceBudget {
    return new PreferenceBudget(
      this.code,
      this.title,
      this.priority,
      this.locale,
      this.currency,
      this.sendAt,
      this.reviewer,
      this.cohort,
      this.bid,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a preference budget in status proposed. */
export function newPreferenceBudget(code: string, title: string): PreferenceBudget {
  return new PreferenceBudget(code, title, 0, "", "", 0, "", "", 0, "", "proposed");
}
