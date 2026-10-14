import * as text from "../../../../kit/text.js";

/** Where a capped csat metric is in its life cycle. */
export type CappedCsatMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a capped csat metric and its current status. */
export class CappedCsatMetric {
  code: string;
  name: string;
  currency: string;
  rate: number;
  amount: number;
  weight: number;
  status: CappedCsatMetricStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    rate: number,
    amount: number,
    weight: number,
    status: CappedCsatMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.rate = rate;
    this.amount = amount;
    this.weight = weight;
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

  canMoveTo(next: CappedCsatMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CappedCsatMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped csat metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.rate + this.amount) * 100) / 100;
  }

  copy(): CappedCsatMetric {
    return new CappedCsatMetric(this.code, this.name, this.currency, this.rate, this.amount, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped csat metric in status draft. */
export function newCappedCsatMetric(code: string, name: string): CappedCsatMetric {
  return new CappedCsatMetric(code, name, "", 0, 0, 0, "draft");
}
