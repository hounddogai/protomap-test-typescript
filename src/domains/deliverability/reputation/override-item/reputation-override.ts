/**
 * The reputation override records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation override is in its life cycle. */
export type ReputationOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A reputation override as the reputation team keeps it. */
export class ReputationOverride {
  code: string;
  label: string;
  amount: number;
  discount: number;
  graceDays: number;
  description: string;
  status: ReputationOverrideStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    discount: number,
    graceDays: number,
    description: string,
    status: ReputationOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.discount = discount;
    this.graceDays = graceDays;
    this.description = description;
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

  canMoveTo(next: ReputationOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ReputationOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.discount + this.graceDays) * 100) / 100;
  }

  copy(): ReputationOverride {
    return new ReputationOverride(
      this.code,
      this.label,
      this.amount,
      this.discount,
      this.graceDays,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation override in status requested. */
export function newReputationOverride(code: string, label: string): ReputationOverride {
  return new ReputationOverride(code, label, 0, 0, 0, "", "requested");
}
