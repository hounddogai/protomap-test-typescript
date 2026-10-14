import * as text from "../../../../kit/text.js";

/** Where a primary flight agreement is in its life cycle. */
export type PrimaryFlightAgreementStatus = "created" | "validated" | "published" | "retired";

/** The record of a primary flight agreement and its current status. */
export class PrimaryFlightAgreement {
  code: string;
  name: string;
  amount: number;
  weight: number;
  externalRef: string;
  threshold: number;
  locale: string;
  status: PrimaryFlightAgreementStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    weight: number,
    externalRef: string,
    threshold: number,
    locale: string,
    status: PrimaryFlightAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.weight = weight;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.locale = locale;
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

  canMoveTo(next: PrimaryFlightAgreementStatus): boolean {
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

  moveTo(next: PrimaryFlightAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary flight agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round((this.amount - this.weight) * 100) / 100;
  }

  copy(): PrimaryFlightAgreement {
    return new PrimaryFlightAgreement(
      this.code,
      this.name,
      this.amount,
      this.weight,
      this.externalRef,
      this.threshold,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary flight agreement in status created. */
export function newPrimaryFlightAgreement(code: string, name: string): PrimaryFlightAgreement {
  return new PrimaryFlightAgreement(code, name, 0, 0, "", 0, "", "created");
}
