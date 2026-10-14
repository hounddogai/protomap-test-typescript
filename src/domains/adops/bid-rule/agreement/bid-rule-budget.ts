import * as text from "../../../../kit/text.js";

/** Where a bid rule budget is in its life cycle. */
export type BidRuleBudgetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a bid rule budget and its current status. */
export class BidRuleBudget {
  code: string;
  title: string;
  region: string;
  unit: string;
  currency: string;
  revision: number;
  windowDays: number;
  status: BidRuleBudgetStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    unit: string,
    currency: string,
    revision: number,
    windowDays: number,
    status: BidRuleBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.unit = unit;
    this.currency = currency;
    this.revision = revision;
    this.windowDays = windowDays;
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

  canMoveTo(next: BidRuleBudgetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active" || next === "closed";
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

  moveTo(next: BidRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"bid rule budget"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.revision + this.windowDays) * 100) / 100;
  }

  copy(): BidRuleBudget {
    return new BidRuleBudget(
      this.code,
      this.title,
      this.region,
      this.unit,
      this.currency,
      this.revision,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a bid rule budget in status draft. */
export function newBidRuleBudget(code: string, title: string): BidRuleBudget {
  return new BidRuleBudget(code, title, "", "", "", 0, 0, "draft");
}
