import * as text from "../../../../kit/text.js";

/** Where a strict mention override is in its life cycle. */
export type StrictMentionOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a strict mention override and its current status. */
export class StrictMentionOverride {
  code: string;
  label: string;
  bid: number;
  minimum: number;
  reviewer: string;
  discount: number;
  limit: number;
  cost: number;
  maximum: number;
  currency: string;
  status: StrictMentionOverrideStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    minimum: number,
    reviewer: string,
    discount: number,
    limit: number,
    cost: number,
    maximum: number,
    currency: string,
    status: StrictMentionOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.minimum = minimum;
    this.reviewer = reviewer;
    this.discount = discount;
    this.limit = limit;
    this.cost = cost;
    this.maximum = maximum;
    this.currency = currency;
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

  canMoveTo(next: StrictMentionOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictMentionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict mention override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.discount - this.cost) * 100) / 100;
  }

  copy(): StrictMentionOverride {
    return new StrictMentionOverride(
      this.code,
      this.label,
      this.bid,
      this.minimum,
      this.reviewer,
      this.discount,
      this.limit,
      this.cost,
      this.maximum,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict mention override in status draft. */
export function newStrictMentionOverride(code: string, label: string): StrictMentionOverride {
  return new StrictMentionOverride(code, label, 0, 0, "", 0, 0, 0, 0, "", "draft");
}
