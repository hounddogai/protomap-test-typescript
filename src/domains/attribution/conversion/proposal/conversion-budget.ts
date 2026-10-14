import * as text from "../../../../kit/text.js";

/** Where a conversion budget is in its life cycle. */
export type ConversionBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A conversion budget. Its code is unique within a tenant. */
export class ConversionBudget {
  code: string;
  name: string;
  label: string;
  graceDays: number;
  locale: string;
  ceiling: number;
  country: string;
  status: ConversionBudgetStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    graceDays: number,
    locale: string,
    ceiling: number,
    country: string,
    status: ConversionBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.graceDays = graceDays;
    this.locale = locale;
    this.ceiling = ceiling;
    this.country = country;
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

  canMoveTo(next: ConversionBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: ConversionBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round(this.ceiling * this.graceDays * 100) / 100;
  }

  copy(): ConversionBudget {
    return new ConversionBudget(
      this.code,
      this.name,
      this.label,
      this.graceDays,
      this.locale,
      this.ceiling,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a conversion budget in status proposed. */
export function newConversionBudget(code: string, name: string): ConversionBudget {
  return new ConversionBudget(code, name, "", 0, "", 0, "", "proposed");
}
