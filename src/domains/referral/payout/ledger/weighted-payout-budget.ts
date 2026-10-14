import * as text from "../../../../kit/text.js";

/** Where a weighted payout budget is in its life cycle. */
export type WeightedPayoutBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A weighted payout budget. Its code is unique within a tenant. */
export class WeightedPayoutBudget {
  code: string;
  title: string;
  rate: number;
  tags: string[];
  discount: number;
  ownerId: string;
  description: string;
  maximum: number;
  category: string;
  status: WeightedPayoutBudgetStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    tags: string[],
    discount: number,
    ownerId: string,
    description: string,
    maximum: number,
    category: string,
    status: WeightedPayoutBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.tags = tags;
    this.discount = discount;
    this.ownerId = ownerId;
    this.description = description;
    this.maximum = maximum;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedPayoutBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPayoutBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted payout budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.discount * this.maximum * 100) / 100;
  }

  copy(): WeightedPayoutBudget {
    return new WeightedPayoutBudget(
      this.code,
      this.title,
      this.rate,
      this.tags,
      this.discount,
      this.ownerId,
      this.description,
      this.maximum,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted payout budget in status requested. */
export function newWeightedPayoutBudget(code: string, title: string): WeightedPayoutBudget {
  return new WeightedPayoutBudget(code, title, 0, [], 0, "", "", 0, "", "requested");
}
