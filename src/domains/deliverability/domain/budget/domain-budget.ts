/**
 * The domain budget records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain budget is in its life cycle. */
export type DomainBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A domain budget. Its code is unique within a tenant. */
export class DomainBudget {
  code: string;
  label: string;
  updatedAt: number;
  discount: number;
  windowDays: number;
  status: DomainBudgetStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    discount: number,
    windowDays: number,
    status: DomainBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.windowDays = windowDays;
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

  canMoveTo(next: DomainBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DomainBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.updatedAt * this.discount * 100) / 100;
  }

  copy(): DomainBudget {
    return new DomainBudget(this.code, this.label, this.updatedAt, this.discount, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a domain budget in status proposed. */
export function newDomainBudget(code: string, label: string): DomainBudget {
  return new DomainBudget(code, label, 0, 0, 0, "proposed");
}
