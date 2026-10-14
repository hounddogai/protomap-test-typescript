import * as text from "../../../../kit/text.js";

/** Where a bid rule window is in its life cycle. */
export type BidRuleWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a bid rule window and its current status. */
export class BidRuleWindow {
  code: string;
  label: string;
  discount: number;
  utmSource: string;
  title: string;
  status: BidRuleWindowStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    utmSource: string,
    title: string,
    status: BidRuleWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.utmSource = utmSource;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BidRuleWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BidRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): BidRuleWindow {
    return new BidRuleWindow(this.code, this.label, this.discount, this.utmSource, this.title, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a bid rule window in status open. */
export function newBidRuleWindow(code: string, label: string): BidRuleWindow {
  return new BidRuleWindow(code, label, 0, "", "", "open");
}
