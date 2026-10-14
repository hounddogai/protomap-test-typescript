import * as text from "../../../../kit/text.js";

/** Where a lenient streak variance is in its life cycle. */
export type LenientStreakVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient streak variance and its current status. */
export class LenientStreakVariance {
  code: string;
  title: string;
  budget: number;
  ownerId: string;
  name: string;
  capacity: number;
  externalRef: string;
  currency: string;
  locale: string;
  bid: number;
  phone: string;
  status: LenientStreakVarianceStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    ownerId: string,
    name: string,
    capacity: number,
    externalRef: string,
    currency: string,
    locale: string,
    bid: number,
    phone: string,
    status: LenientStreakVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.ownerId = ownerId;
    this.name = name;
    this.capacity = capacity;
    this.externalRef = externalRef;
    this.currency = currency;
    this.locale = locale;
    this.bid = bid;
    this.phone = phone;
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

  canMoveTo(next: LenientStreakVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientStreakVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient streak variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient streak variance"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.bid * this.budget * 100) / 100;
  }

  copy(): LenientStreakVariance {
    return new LenientStreakVariance(
      this.code,
      this.title,
      this.budget,
      this.ownerId,
      this.name,
      this.capacity,
      this.externalRef,
      this.currency,
      this.locale,
      this.bid,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient streak variance in status proposed. */
export function newLenientStreakVariance(code: string, title: string): LenientStreakVariance {
  return new LenientStreakVariance(code, title, 0, "", "", 0, "", "", "", 0, "", "proposed");
}
