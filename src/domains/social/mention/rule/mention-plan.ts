import * as text from "../../../../kit/text.js";

/** Where a mention plan is in its life cycle. */
export type MentionPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a mention plan and its current status. */
export class MentionPlan {
  code: string;
  label: string;
  reviewer: string;
  minimum: number;
  rate: number;
  conversionRate: number;
  bid: number;
  discount: number;
  name: string;
  source: string;
  status: MentionPlanStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    minimum: number,
    rate: number,
    conversionRate: number,
    bid: number,
    discount: number,
    name: string,
    source: string,
    status: MentionPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.rate = rate;
    this.conversionRate = conversionRate;
    this.bid = bid;
    this.discount = discount;
    this.name = name;
    this.source = source;
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

  canMoveTo(next: MentionPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedLoad(): number {
    return Math.round((this.rate + this.discount) * 100) / 100;
  }

  copy(): MentionPlan {
    return new MentionPlan(
      this.code,
      this.label,
      this.reviewer,
      this.minimum,
      this.rate,
      this.conversionRate,
      this.bid,
      this.discount,
      this.name,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a mention plan in status proposed. */
export function newMentionPlan(code: string, label: string): MentionPlan {
  return new MentionPlan(code, label, "", 0, 0, 0, 0, 0, "", "", "proposed");
}
