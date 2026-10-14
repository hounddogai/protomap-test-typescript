import * as text from "../../../../kit/text.js";

/** Where a legacy opt out budget is in its life cycle. */
export type LegacyOptOutBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a legacy opt out budget and its current status. */
export class LegacyOptOutBudget {
  code: string;
  name: string;
  maximum: number;
  ownerId: string;
  currency: string;
  category: string;
  journeyId: string;
  label: string;
  budget: number;
  bid: number;
  cost: number;
  status: LegacyOptOutBudgetStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    ownerId: string,
    currency: string,
    category: string,
    journeyId: string,
    label: string,
    budget: number,
    bid: number,
    cost: number,
    status: LegacyOptOutBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.ownerId = ownerId;
    this.currency = currency;
    this.category = category;
    this.journeyId = journeyId;
    this.label = label;
    this.budget = budget;
    this.bid = bid;
    this.cost = cost;
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

  canMoveTo(next: LegacyOptOutBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyOptOutBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy opt out budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedLoad(): number {
    return Math.round((this.bid - this.maximum) * 100) / 100;
  }

  copy(): LegacyOptOutBudget {
    return new LegacyOptOutBudget(
      this.code,
      this.name,
      this.maximum,
      this.ownerId,
      this.currency,
      this.category,
      this.journeyId,
      this.label,
      this.budget,
      this.bid,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy opt out budget in status draft. */
export function newLegacyOptOutBudget(code: string, name: string): LegacyOptOutBudget {
  return new LegacyOptOutBudget(code, name, 0, "", "", "", "", "", 0, 0, 0, "draft");
}
