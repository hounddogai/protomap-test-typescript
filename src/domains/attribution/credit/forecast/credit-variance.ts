import * as text from "../../../../kit/text.js";

/** Where a credit variance is in its life cycle. */
export type CreditVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A credit variance as the credit team keeps it. */
export class CreditVariance {
  code: string;
  title: string;
  windowDays: number;
  discount: number;
  contactEmail: string;
  status: CreditVarianceStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    discount: number,
    contactEmail: string,
    status: CreditVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.discount = discount;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: CreditVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreditVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.windowDays + this.discount) * 100) / 100;
  }

  copy(): CreditVariance {
    return new CreditVariance(this.code, this.title, this.windowDays, this.discount, this.contactEmail, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit variance in status requested. */
export function newCreditVariance(code: string, title: string): CreditVariance {
  return new CreditVariance(code, title, 0, 0, "", "requested");
}
