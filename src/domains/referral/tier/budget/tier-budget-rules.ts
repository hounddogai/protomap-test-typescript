import * as text from "../../../../kit/text.js";
import { TierBudget } from "./tier-budget.js";

/** A rule a tier budget must pass. Check returns its problems, or none. */
export interface TierBudgetRule {
  check(item: TierBudget): string[];
}

export class TierBudgetRequiredPhoneRule implements TierBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierBudget): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class TierBudgetAllowedPhoneRule implements TierBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is stale`];
    return [];
  }
}

export class TierBudgetRequiredLabelRule implements TierBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tier budget. */
export class TierBudgetValidator {
  rules: TierBudgetRule[];

  constructor(rules: TierBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: TierBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierBudget[]): Map<string, string[]> {
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

export function defaultTierBudgetValidator(): TierBudgetValidator {
  return new TierBudgetValidator(
    [
      new TierBudgetRequiredPhoneRule("tier budget needs a value"),
      new TierBudgetAllowedPhoneRule(["seasonal"]),
      new TierBudgetRequiredLabelRule("tier budget needs a value"),
    ],
  );
}
