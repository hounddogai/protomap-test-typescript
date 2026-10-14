/**
 * The primary approval agreement records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary approval agreement is in its life cycle. */
export type PrimaryApprovalAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a primary approval agreement and its current status. */
export class PrimaryApprovalAgreement {
  code: string;
  name: string;
  visible: boolean;
  locale: string;
  channel: string;
  priority: number;
  currency: string;
  contactEmail: string;
  budget: number;
  status: PrimaryApprovalAgreementStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    locale: string,
    channel: string,
    priority: number,
    currency: string,
    contactEmail: string,
    budget: number,
    status: PrimaryApprovalAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.locale = locale;
    this.channel = channel;
    this.priority = priority;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.budget = budget;
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

  canMoveTo(next: PrimaryApprovalAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
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

  moveTo(next: PrimaryApprovalAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary approval agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round(this.priority * this.budget * 100) / 100;
  }

  copy(): PrimaryApprovalAgreement {
    return new PrimaryApprovalAgreement(
      this.code,
      this.name,
      this.visible,
      this.locale,
      this.channel,
      this.priority,
      this.currency,
      this.contactEmail,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary approval agreement in status proposed. */
export function newPrimaryApprovalAgreement(code: string, name: string): PrimaryApprovalAgreement {
  return new PrimaryApprovalAgreement(code, name, false, "", "", 0, "", "", 0, "proposed");
}
