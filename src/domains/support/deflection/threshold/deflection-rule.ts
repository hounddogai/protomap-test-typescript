import * as text from "../../../../kit/text.js";

/** Where a deflection rule is in its life cycle. */
export type DeflectionRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A deflection rule as the deflection team keeps it. */
export class DeflectionRule {
  code: string;
  name: string;
  campaignRef: string;
  startsAt: number;
  budget: number;
  status: DeflectionRuleStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    startsAt: number,
    budget: number,
    status: DeflectionRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.budget = budget;
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

  canMoveTo(next: DeflectionRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DeflectionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round(this.budget * this.startsAt * 100) / 100;
  }

  copy(): DeflectionRule {
    return new DeflectionRule(this.code, this.name, this.campaignRef, this.startsAt, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a deflection rule in status open. */
export function newDeflectionRule(code: string, name: string): DeflectionRule {
  return new DeflectionRule(code, name, "", 0, 0, "open");
}
