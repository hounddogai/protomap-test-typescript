import * as text from "../../../../kit/text.js";

/** Where a strict frequency rollup is in its life cycle. */
export type StrictFrequencyRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A strict frequency rollup. Its code is unique within a tenant. */
export class StrictFrequencyRollup {
  code: string;
  label: string;
  currency: string;
  amount: number;
  discount: number;
  limit: number;
  approved: boolean;
  status: StrictFrequencyRollupStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    amount: number,
    discount: number,
    limit: number,
    approved: boolean,
    status: StrictFrequencyRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.amount = amount;
    this.discount = discount;
    this.limit = limit;
    this.approved = approved;
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

  canMoveTo(next: StrictFrequencyRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
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

  moveTo(next: StrictFrequencyRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict frequency rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.amount - this.limit) * 100) / 100;
  }

  copy(): StrictFrequencyRollup {
    return new StrictFrequencyRollup(
      this.code,
      this.label,
      this.currency,
      this.amount,
      this.discount,
      this.limit,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict frequency rollup in status proposed. */
export function newStrictFrequencyRollup(code: string, label: string): StrictFrequencyRollup {
  return new StrictFrequencyRollup(code, label, "", 0, 0, 0, false, "proposed");
}
