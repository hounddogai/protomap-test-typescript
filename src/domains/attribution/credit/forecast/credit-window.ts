import * as text from "../../../../kit/text.js";

/** Where a credit window is in its life cycle. */
export type CreditWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A credit window. Its code is unique within a tenant. */
export class CreditWindow {
  code: string;
  title: string;
  budget: number;
  locale: string;
  graceDays: number;
  status: CreditWindowStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    locale: string,
    graceDays: number,
    status: CreditWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.locale = locale;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CreditWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit window"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.budget + this.graceDays) * 100) / 100;
  }

  copy(): CreditWindow {
    return new CreditWindow(this.code, this.title, this.budget, this.locale, this.graceDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit window in status draft. */
export function newCreditWindow(code: string, title: string): CreditWindow {
  return new CreditWindow(code, title, 0, "", 0, "draft");
}
