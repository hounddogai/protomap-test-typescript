/**
 * The branch rule records of journeys's branch work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a branch rule is in its life cycle. */
export type BranchRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A branch rule. Its code is unique within a tenant. */
export class BranchRule {
  code: string;
  title: string;
  currency: string;
  audienceId: string;
  journeyId: string;
  amount: number;
  status: BranchRuleStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    audienceId: string,
    journeyId: string,
    amount: number,
    status: BranchRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.amount = amount;
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

  canMoveTo(next: BranchRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): BranchRule {
    return new BranchRule(
      this.code,
      this.title,
      this.currency,
      this.audienceId,
      this.journeyId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch rule in status open. */
export function newBranchRule(code: string, title: string): BranchRule {
  return new BranchRule(code, title, "", "", "", 0, "open");
}
