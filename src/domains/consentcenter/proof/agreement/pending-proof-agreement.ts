/**
 * The pending proof agreement records of consentcenter's proof work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending proof agreement is in its life cycle. */
export type PendingProofAgreementStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending proof agreement and its current status. */
export class PendingProofAgreement {
  code: string;
  name: string;
  timezone: string;
  amount: number;
  currency: string;
  status: PendingProofAgreementStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    amount: number,
    currency: string,
    status: PendingProofAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingProofAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingProofAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending proof agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): PendingProofAgreement {
    return new PendingProofAgreement(this.code, this.name, this.timezone, this.amount, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending proof agreement in status created. */
export function newPendingProofAgreement(code: string, name: string): PendingProofAgreement {
  return new PendingProofAgreement(code, name, "", 0, "", "created");
}
