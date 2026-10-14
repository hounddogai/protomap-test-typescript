import { PendingBidRulePlan } from "./pending-bid-rule-plan.js";

/** A rule a pending bid rule plan must pass. Check returns its problems, or none. */
export interface PendingBidRulePlanRule {
  check(item: PendingBidRulePlan): string[];
}

export class PendingBidRulePlanBudgetRangeRule implements PendingBidRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRulePlan): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBidRulePlanRequiredCodeRule implements PendingBidRulePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRulePlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBidRulePlanCountryLengthRule implements PendingBidRulePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRulePlan): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRulePlanMaximumRangeRule implements PendingBidRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRulePlan): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pending bid rule plan. */
export class PendingBidRulePlanValidator {
  rules: PendingBidRulePlanRule[];

  constructor(rules: PendingBidRulePlanRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRulePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: PendingBidRulePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRulePlan[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultPendingBidRulePlanValidator(): PendingBidRulePlanValidator {
  return new PendingBidRulePlanValidator(
    [
      new PendingBidRulePlanBudgetRangeRule(8.4, 3323.6),
      new PendingBidRulePlanRequiredCodeRule("pending bid rule plan needs this field"),
      new PendingBidRulePlanCountryLengthRule(255),
      new PendingBidRulePlanMaximumRangeRule(0, 1667.6),
    ],
  );
}
