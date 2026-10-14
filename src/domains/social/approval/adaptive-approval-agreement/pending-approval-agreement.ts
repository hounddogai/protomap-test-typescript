/**
 * The pending approval agreement records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending approval agreement is in its life cycle. */
export type PendingApprovalAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a pending approval agreement and its current status. */
export class PendingApprovalAgreement {
  code: string;
  label: string;
  active: boolean;
  weight: number;
  title: string;
  expiresAt: number;
  approved: boolean;
  contactEmail: string;
  updatedAt: number;
  attempts: number;
  amount: number;
  status: PendingApprovalAgreementStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    weight: number,
    title: string,
    expiresAt: number,
    approved: boolean,
    contactEmail: string,
    updatedAt: number,
    attempts: number,
    amount: number,
    status: PendingApprovalAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.weight = weight;
    this.title = title;
    this.expiresAt = expiresAt;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
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

  canMoveTo(next: PendingApprovalAgreementStatus): boolean {
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
          case "withdrawn":
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

  moveTo(next: PendingApprovalAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending approval agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.expiresAt + this.amount) * 100) / 100;
  }

  copy(): PendingApprovalAgreement {
    return new PendingApprovalAgreement(
      this.code,
      this.label,
      this.active,
      this.weight,
      this.title,
      this.expiresAt,
      this.approved,
      this.contactEmail,
      this.updatedAt,
      this.attempts,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending approval agreement in status proposed. */
export function newPendingApprovalAgreement(code: string, label: string): PendingApprovalAgreement {
  return new PendingApprovalAgreement(code, label, false, 0, "", 0, false, "", 0, 0, 0, "proposed");
}
