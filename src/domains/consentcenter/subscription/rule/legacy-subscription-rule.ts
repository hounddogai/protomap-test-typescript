/**
 * The legacy subscription rule records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy subscription rule is in its life cycle. */
export type LegacySubscriptionRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy subscription rule as the subscription team keeps it. */
export class LegacySubscriptionRule {
  code: string;
  title: string;
  category: string;
  variant: string;
  pinned: boolean;
  amount: number;
  status: LegacySubscriptionRuleStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    variant: string,
    pinned: boolean,
    amount: number,
    status: LegacySubscriptionRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.variant = variant;
    this.pinned = pinned;
    this.amount = amount;
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

  canMoveTo(next: LegacySubscriptionRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacySubscriptionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy subscription rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): LegacySubscriptionRule {
    return new LegacySubscriptionRule(
      this.code,
      this.title,
      this.category,
      this.variant,
      this.pinned,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy subscription rule in status proposed. */
export function newLegacySubscriptionRule(code: string, title: string): LegacySubscriptionRule {
  return new LegacySubscriptionRule(code, title, "", "", false, 0, "proposed");
}
