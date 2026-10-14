import * as text from "../../../../kit/text.js";

/** Where a default exit rule claim is in its life cycle. */
export type DefaultExitRuleClaimStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default exit rule claim and its current status. */
export class DefaultExitRuleClaim {
  code: string;
  label: string;
  impressions: number;
  graceDays: number;
  minimum: number;
  status: DefaultExitRuleClaimStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    graceDays: number,
    minimum: number,
    status: DefaultExitRuleClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.graceDays = graceDays;
    this.minimum = minimum;
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

  canMoveTo(next: DefaultExitRuleClaimStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultExitRuleClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default exit rule claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"default exit rule claim"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.graceDays - this.impressions) * 100) / 100;
  }

  copy(): DefaultExitRuleClaim {
    return new DefaultExitRuleClaim(this.code, this.label, this.impressions, this.graceDays, this.minimum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default exit rule claim in status proposed. */
export function newDefaultExitRuleClaim(code: string, label: string): DefaultExitRuleClaim {
  return new DefaultExitRuleClaim(code, label, 0, 0, 0, "proposed");
}
