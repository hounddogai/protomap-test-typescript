/**
 * The pending bid rule preference records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending bid rule preference is in its life cycle. */
export type PendingBidRulePreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a pending bid rule preference and its current status. */
export class PendingBidRulePreference {
  code: string;
  label: string;
  budget: number;
  reviewer: string;
  quantity: number;
  windowDays: number;
  utmSource: string;
  status: PendingBidRulePreferenceStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    reviewer: string,
    quantity: number,
    windowDays: number,
    utmSource: string,
    status: PendingBidRulePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.utmSource = utmSource;
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

  canMoveTo(next: PendingBidRulePreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBidRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending bid rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending bid rule preference"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.quantity - this.budget) * 100) / 100;
  }

  copy(): PendingBidRulePreference {
    return new PendingBidRulePreference(
      this.code,
      this.label,
      this.budget,
      this.reviewer,
      this.quantity,
      this.windowDays,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending bid rule preference in status planned. */
export function newPendingBidRulePreference(code: string, label: string): PendingBidRulePreference {
  return new PendingBidRulePreference(code, label, 0, "", 0, 0, "", "planned");
}
