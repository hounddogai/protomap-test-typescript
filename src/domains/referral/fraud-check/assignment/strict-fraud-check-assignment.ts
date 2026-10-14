/**
 * The strict fraud check assignment records of referral's fraud check work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict fraud check assignment is in its life cycle. */
export type StrictFraudCheckAssignmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict fraud check assignment. Its code is unique within a tenant. */
export class StrictFraudCheckAssignment {
  code: string;
  name: string;
  currency: string;
  discount: number;
  locale: string;
  status: StrictFraudCheckAssignmentStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    discount: number,
    locale: string,
    status: StrictFraudCheckAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.discount = discount;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictFraudCheckAssignmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictFraudCheckAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict fraud check assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): StrictFraudCheckAssignment {
    return new StrictFraudCheckAssignment(this.code, this.name, this.currency, this.discount, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict fraud check assignment in status draft. */
export function newStrictFraudCheckAssignment(code: string, name: string): StrictFraudCheckAssignment {
  return new StrictFraudCheckAssignment(code, name, "", 0, "", "draft");
}
