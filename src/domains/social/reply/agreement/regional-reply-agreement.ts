/**
 * The regional reply agreement records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional reply agreement is in its life cycle. */
export type RegionalReplyAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional reply agreement as the reply team keeps it. */
export class RegionalReplyAgreement {
  code: string;
  title: string;
  windowDays: number;
  createdAt: number;
  ceiling: number;
  budget: number;
  amount: number;
  priority: number;
  floorValue: number;
  minimum: number;
  status: RegionalReplyAgreementStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    createdAt: number,
    ceiling: number,
    budget: number,
    amount: number,
    priority: number,
    floorValue: number,
    minimum: number,
    status: RegionalReplyAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.budget = budget;
    this.amount = amount;
    this.priority = priority;
    this.floorValue = floorValue;
    this.minimum = minimum;
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

  canMoveTo(next: RegionalReplyAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalReplyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reply agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.budget - this.windowDays) * 100) / 100;
  }

  copy(): RegionalReplyAgreement {
    return new RegionalReplyAgreement(
      this.code,
      this.title,
      this.windowDays,
      this.createdAt,
      this.ceiling,
      this.budget,
      this.amount,
      this.priority,
      this.floorValue,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional reply agreement in status proposed. */
export function newRegionalReplyAgreement(code: string, title: string): RegionalReplyAgreement {
  return new RegionalReplyAgreement(code, title, 0, 0, 0, 0, 0, 0, 0, 0, "proposed");
}
