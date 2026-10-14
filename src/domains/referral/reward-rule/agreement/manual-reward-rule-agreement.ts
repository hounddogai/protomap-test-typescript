/**
 * The manual reward rule agreement records of referral's reward rule work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual reward rule agreement is in its life cycle. */
export type ManualRewardRuleAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual reward rule agreement. Its code is unique within a tenant. */
export class ManualRewardRuleAgreement {
  code: string;
  title: string;
  locale: string;
  quantity: number;
  maximum: number;
  status: ManualRewardRuleAgreementStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    quantity: number,
    maximum: number,
    status: ManualRewardRuleAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.quantity = quantity;
    this.maximum = maximum;
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

  canMoveTo(next: ManualRewardRuleAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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

  moveTo(next: ManualRewardRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round((this.quantity - this.maximum) * 100) / 100;
  }

  copy(): ManualRewardRuleAgreement {
    return new ManualRewardRuleAgreement(this.code, this.title, this.locale, this.quantity, this.maximum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual reward rule agreement in status proposed. */
export function newManualRewardRuleAgreement(code: string, title: string): ManualRewardRuleAgreement {
  return new ManualRewardRuleAgreement(code, title, "", 0, 0, "proposed");
}
