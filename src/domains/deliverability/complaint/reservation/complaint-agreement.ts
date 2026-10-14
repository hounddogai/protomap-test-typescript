import * as text from "../../../../kit/text.js";

/** Where a complaint agreement is in its life cycle. */
export type ComplaintAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A complaint agreement. Its code is unique within a tenant. */
export class ComplaintAgreement {
  code: string;
  title: string;
  maximum: number;
  budget: number;
  floorValue: number;
  phone: string;
  journeyId: string;
  ceiling: number;
  expiresAt: number;
  status: ComplaintAgreementStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    budget: number,
    floorValue: number,
    phone: string,
    journeyId: string,
    ceiling: number,
    expiresAt: number,
    status: ComplaintAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.budget = budget;
    this.floorValue = floorValue;
    this.phone = phone;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: ComplaintAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: ComplaintAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"complaint agreement"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.maximum * this.budget * 100) / 100;
  }

  copy(): ComplaintAgreement {
    return new ComplaintAgreement(
      this.code,
      this.title,
      this.maximum,
      this.budget,
      this.floorValue,
      this.phone,
      this.journeyId,
      this.ceiling,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a complaint agreement in status proposed. */
export function newComplaintAgreement(code: string, title: string): ComplaintAgreement {
  return new ComplaintAgreement(code, title, 0, 0, 0, "", "", 0, 0, "proposed");
}
