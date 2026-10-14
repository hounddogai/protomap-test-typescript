import * as text from "../../../../kit/text.js";

/** Where a bid rule assignment is in its life cycle. */
export type BidRuleAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A bid rule assignment as the bid rule team keeps it. */
export class BidRuleAssignment {
  code: string;
  title: string;
  label: string;
  quantity: number;
  country: string;
  status: BidRuleAssignmentStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    quantity: number,
    country: string,
    status: BidRuleAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.quantity = quantity;
    this.country = country;
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

  canMoveTo(next: BidRuleAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BidRuleAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): BidRuleAssignment {
    return new BidRuleAssignment(this.code, this.title, this.label, this.quantity, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a bid rule assignment in status proposed. */
export function newBidRuleAssignment(code: string, title: string): BidRuleAssignment {
  return new BidRuleAssignment(code, title, "", 0, "", "proposed");
}
