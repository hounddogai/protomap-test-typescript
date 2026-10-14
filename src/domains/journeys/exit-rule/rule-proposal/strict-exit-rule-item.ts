import * as text from "../../../../kit/text.js";

/** Where a strict exit rule item is in its life cycle. */
export type StrictExitRuleItemStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a strict exit rule item and its current status. */
export class StrictExitRuleItem {
  code: string;
  label: string;
  cost: number;
  bid: number;
  description: string;
  tags: string[];
  graceDays: number;
  status: StrictExitRuleItemStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    bid: number,
    description: string,
    tags: string[],
    graceDays: number,
    status: StrictExitRuleItemStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.bid = bid;
    this.description = description;
    this.tags = tags;
    this.graceDays = graceDays;
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

  canMoveTo(next: StrictExitRuleItemStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
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

  moveTo(next: StrictExitRuleItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict exit rule item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.graceDays - this.cost) * 100) / 100;
  }

  copy(): StrictExitRuleItem {
    return new StrictExitRuleItem(
      this.code,
      this.label,
      this.cost,
      this.bid,
      this.description,
      this.tags,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict exit rule item in status proposed. */
export function newStrictExitRuleItem(code: string, label: string): StrictExitRuleItem {
  return new StrictExitRuleItem(code, label, 0, 0, "", [], 0, "proposed");
}
