/**
 * The streak agreement records of loyaltyhub's streak work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak agreement is in its life cycle. */
export type StreakAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A streak agreement. Its code is unique within a tenant. */
export class StreakAgreement {
  code: string;
  name: string;
  currency: string;
  batchSize: number;
  checksum: string;
  phone: string;
  locale: string;
  ceiling: number;
  createdAt: number;
  category: string;
  status: StreakAgreementStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    batchSize: number,
    checksum: string,
    phone: string,
    locale: string,
    ceiling: number,
    createdAt: number,
    category: string,
    status: StreakAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.batchSize = batchSize;
    this.checksum = checksum;
    this.phone = phone;
    this.locale = locale;
    this.ceiling = ceiling;
    this.createdAt = createdAt;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StreakAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round((this.createdAt - this.ceiling) * 100) / 100;
  }

  copy(): StreakAgreement {
    return new StreakAgreement(
      this.code,
      this.name,
      this.currency,
      this.batchSize,
      this.checksum,
      this.phone,
      this.locale,
      this.ceiling,
      this.createdAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a streak agreement in status open. */
export function newStreakAgreement(code: string, name: string): StreakAgreement {
  return new StreakAgreement(code, name, "", 0, "", "", "", 0, 0, "", "open");
}
