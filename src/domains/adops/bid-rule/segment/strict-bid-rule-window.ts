import * as text from "../../../../kit/text.js";

/** Where a strict bid rule window is in its life cycle. */
export type StrictBidRuleWindowStatus = "created" | "validated" | "published" | "retired";

/** A strict bid rule window as the bid rule team keeps it. */
export class StrictBidRuleWindow {
  code: string;
  title: string;
  conversionRate: number;
  ratio: number;
  rate: number;
  category: string;
  quantity: number;
  name: string;
  clicks: number;
  status: StrictBidRuleWindowStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    ratio: number,
    rate: number,
    category: string,
    quantity: number,
    name: string,
    clicks: number,
    status: StrictBidRuleWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.ratio = ratio;
    this.rate = rate;
    this.category = category;
    this.quantity = quantity;
    this.name = name;
    this.clicks = clicks;
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

  canMoveTo(next: StrictBidRuleWindowStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StrictBidRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bid rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.ratio + this.quantity) * 100) / 100;
  }

  copy(): StrictBidRuleWindow {
    return new StrictBidRuleWindow(
      this.code,
      this.title,
      this.conversionRate,
      this.ratio,
      this.rate,
      this.category,
      this.quantity,
      this.name,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict bid rule window in status created. */
export function newStrictBidRuleWindow(code: string, title: string): StrictBidRuleWindow {
  return new StrictBidRuleWindow(code, title, 0, 0, 0, "", 0, "", 0, "created");
}
