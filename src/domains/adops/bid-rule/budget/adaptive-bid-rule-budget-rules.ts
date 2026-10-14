import { AdaptiveBidRuleBudget } from "./adaptive-bid-rule-budget.js";

/** A rule a adaptive bid rule budget must pass. Check returns its problems, or none. */
export interface AdaptiveBidRuleBudgetRule {
  check(item: AdaptiveBidRuleBudget): string[];
}

export class AdaptiveBidRuleBudgetLabelLengthRule implements AdaptiveBidRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBidRuleBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBidRuleBudgetRequiredLabelRule implements AdaptiveBidRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBidRuleBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBidRuleBudgetCodeLengthRule implements AdaptiveBidRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBidRuleBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive bid rule budget. */
export class AdaptiveBidRuleBudgetValidator {
  rules: AdaptiveBidRuleBudgetRule[];

  constructor(rules: AdaptiveBidRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBidRuleBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveBidRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBidRuleBudget[]): Map<string, string[]> {
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

export function defaultAdaptiveBidRuleBudgetValidator(): AdaptiveBidRuleBudgetValidator {
  return new AdaptiveBidRuleBudgetValidator(
    [
      new AdaptiveBidRuleBudgetLabelLengthRule(120),
      new AdaptiveBidRuleBudgetRequiredLabelRule("adaptive bid rule budget needs an entry"),
      new AdaptiveBidRuleBudgetCodeLengthRule(120),
    ],
  );
}
