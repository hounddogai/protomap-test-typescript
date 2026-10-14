/**
 * The payout rule records of referral's payout work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a payout rule is in its life cycle. */
export type PayoutRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** A payout rule. Its code is unique within a tenant. */
export class PayoutRule {
  code: string;
  label: string;
  quantity: number;
  version: number;
  locale: string;
  notes: string;
  sequence: number;
  attempts: number;
  active: boolean;
  status: PayoutRuleStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    version: number,
    locale: string,
    notes: string,
    sequence: number,
    attempts: number,
    active: boolean,
    status: PayoutRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.version = version;
    this.locale = locale;
    this.notes = notes;
    this.sequence = sequence;
    this.attempts = attempts;
    this.active = active;
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

  canMoveTo(next: PayoutRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
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

  moveTo(next: PayoutRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.attempts - this.version) * 100) / 100;
  }

  copy(): PayoutRule {
    return new PayoutRule(
      this.code,
      this.label,
      this.quantity,
      this.version,
      this.locale,
      this.notes,
      this.sequence,
      this.attempts,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout rule in status requested. */
export function newPayoutRule(code: string, label: string): PayoutRule {
  return new PayoutRule(code, label, 0, 0, "", "", 0, 0, false, "requested");
}
