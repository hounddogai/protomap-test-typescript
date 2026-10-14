import * as text from "../../../../kit/text.js";

/** Where a credit summary is in its life cycle. */
export type CreditSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A credit summary. Its code is unique within a tenant. */
export class CreditSummary {
  code: string;
  name: string;
  score: number;
  locale: string;
  description: string;
  openRate: number;
  quantity: number;
  discount: number;
  status: CreditSummaryStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    locale: string,
    description: string,
    openRate: number,
    quantity: number,
    discount: number,
    status: CreditSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.locale = locale;
    this.description = description;
    this.openRate = openRate;
    this.quantity = quantity;
    this.discount = discount;
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

  canMoveTo(next: CreditSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round((this.openRate + this.score) * 100) / 100;
  }

  copy(): CreditSummary {
    return new CreditSummary(
      this.code,
      this.name,
      this.score,
      this.locale,
      this.description,
      this.openRate,
      this.quantity,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit summary in status open. */
export function newCreditSummary(code: string, name: string): CreditSummary {
  return new CreditSummary(code, name, 0, "", "", 0, 0, 0, "open");
}
