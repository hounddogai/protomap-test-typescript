/**
 * The adaptive bid rule budget records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive bid rule budget is in its life cycle. */
export type AdaptiveBidRuleBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive bid rule budget as the bid rule team keeps it. */
export class AdaptiveBidRuleBudget {
  code: string;
  label: string;
  conversionRate: number;
  budget: number;
  channel: string;
  notes: string;
  status: AdaptiveBidRuleBudgetStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    budget: number,
    channel: string,
    notes: string,
    status: AdaptiveBidRuleBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.budget = budget;
    this.channel = channel;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveBidRuleBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBidRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive bid rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round(this.conversionRate * this.budget * 100) / 100;
  }

  copy(): AdaptiveBidRuleBudget {
    return new AdaptiveBidRuleBudget(
      this.code,
      this.label,
      this.conversionRate,
      this.budget,
      this.channel,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive bid rule budget in status requested. */
export function newAdaptiveBidRuleBudget(code: string, label: string): AdaptiveBidRuleBudget {
  return new AdaptiveBidRuleBudget(code, label, 0, 0, "", "", "requested");
}
