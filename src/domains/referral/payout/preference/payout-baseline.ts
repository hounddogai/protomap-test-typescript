import * as text from "../../../../kit/text.js";

/** Where a payout baseline is in its life cycle. */
export type PayoutBaselineStatus = "created" | "validated" | "published" | "retired";

/** A payout baseline. Its code is unique within a tenant. */
export class PayoutBaseline {
  code: string;
  title: string;
  weight: number;
  name: string;
  region: string;
  status: PayoutBaselineStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    name: string,
    region: string,
    status: PayoutBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.name = name;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): PayoutBaseline {
    return new PayoutBaseline(this.code, this.title, this.weight, this.name, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a payout baseline in status created. */
export function newPayoutBaseline(code: string, title: string): PayoutBaseline {
  return new PayoutBaseline(code, title, 0, "", "", "created");
}
