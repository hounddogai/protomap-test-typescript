import * as text from "../../../../kit/text.js";

/** Where a exit rule variance is in its life cycle. */
export type ExitRuleVarianceStatus = "created" | "validated" | "published" | "retired";

/** A exit rule variance as the exit rule team keeps it. */
export class ExitRuleVariance {
  code: string;
  label: string;
  clicks: number;
  discount: number;
  expiresAt: number;
  quantity: number;
  description: string;
  bid: number;
  currency: string;
  status: ExitRuleVarianceStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    discount: number,
    expiresAt: number,
    quantity: number,
    description: string,
    bid: number,
    currency: string,
    status: ExitRuleVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.discount = discount;
    this.expiresAt = expiresAt;
    this.quantity = quantity;
    this.description = description;
    this.bid = bid;
    this.currency = currency;
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

  canMoveTo(next: ExitRuleVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netExposure(): number {
    return Math.round((this.discount - this.bid) * 100) / 100;
  }

  copy(): ExitRuleVariance {
    return new ExitRuleVariance(
      this.code,
      this.label,
      this.clicks,
      this.discount,
      this.expiresAt,
      this.quantity,
      this.description,
      this.bid,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a exit rule variance in status created. */
export function newExitRuleVariance(code: string, label: string): ExitRuleVariance {
  return new ExitRuleVariance(code, label, 0, 0, 0, 0, "", 0, "", "created");
}
