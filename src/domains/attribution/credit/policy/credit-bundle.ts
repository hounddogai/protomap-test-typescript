import * as text from "../../../../kit/text.js";

/** Where a credit bundle is in its life cycle. */
export type CreditBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A credit bundle as the credit team keeps it. */
export class CreditBundle {
  code: string;
  title: string;
  capacity: number;
  source: string;
  locale: string;
  amount: number;
  status: CreditBundleStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    source: string,
    locale: string,
    amount: number,
    status: CreditBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.source = source;
    this.locale = locale;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreditBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round(this.capacity * this.amount * 100) / 100;
  }

  copy(): CreditBundle {
    return new CreditBundle(this.code, this.title, this.capacity, this.source, this.locale, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a credit bundle in status planned. */
export function newCreditBundle(code: string, title: string): CreditBundle {
  return new CreditBundle(code, title, 0, "", "", 0, "planned");
}
