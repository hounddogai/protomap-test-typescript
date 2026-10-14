import * as text from "../../../../kit/text.js";

/** Where a manual credit record is in its life cycle. */
export type ManualCreditRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual credit record as the credit team keeps it. */
export class ManualCreditRecord {
  code: string;
  name: string;
  discount: number;
  contactEmail: string;
  budget: number;
  attempts: number;
  maximum: number;
  cohort: string;
  ratio: number;
  status: ManualCreditRecordStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    contactEmail: string,
    budget: number,
    attempts: number,
    maximum: number,
    cohort: string,
    ratio: number,
    status: ManualCreditRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.attempts = attempts;
    this.maximum = maximum;
    this.cohort = cohort;
    this.ratio = ratio;
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

  canMoveTo(next: ManualCreditRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: ManualCreditRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual credit record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.ratio + this.maximum) * 100) / 100;
  }

  copy(): ManualCreditRecord {
    return new ManualCreditRecord(
      this.code,
      this.name,
      this.discount,
      this.contactEmail,
      this.budget,
      this.attempts,
      this.maximum,
      this.cohort,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual credit record in status requested. */
export function newManualCreditRecord(code: string, name: string): ManualCreditRecord {
  return new ManualCreditRecord(code, name, 0, "", 0, 0, 0, "", 0, "requested");
}
