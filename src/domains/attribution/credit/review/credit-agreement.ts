import * as text from "../../../../kit/text.js";

/** Where a credit agreement is in its life cycle. */
export type CreditAgreementStatus = "created" | "validated" | "published" | "retired";

/** The record of a credit agreement and its current status. */
export class CreditAgreement {
  code: string;
  label: string;
  revision: number;
  ceiling: number;
  graceDays: number;
  journeyId: string;
  contactEmail: string;
  status: CreditAgreementStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    ceiling: number,
    graceDays: number,
    journeyId: string,
    contactEmail: string,
    status: CreditAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.ceiling = ceiling;
    this.graceDays = graceDays;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: CreditAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CreditAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round((this.ceiling + this.graceDays) * 100) / 100;
  }

  copy(): CreditAgreement {
    return new CreditAgreement(
      this.code,
      this.label,
      this.revision,
      this.ceiling,
      this.graceDays,
      this.journeyId,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a credit agreement in status created. */
export function newCreditAgreement(code: string, label: string): CreditAgreement {
  return new CreditAgreement(code, label, 0, 0, 0, "", "", "created");
}
