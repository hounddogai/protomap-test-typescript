import { CappedDeflectionBudget } from "./capped-deflection-budget.js";

/** A rule a capped deflection budget must pass. Check returns its problems, or none. */
export interface CappedDeflectionBudgetRule {
  check(item: CappedDeflectionBudget): string[];
}

export class CappedDeflectionBudgetCodePrefixRule implements CappedDeflectionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedDeflectionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedDeflectionBudgetThresholdRangeRule implements CappedDeflectionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedDeflectionBudget): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedDeflectionBudgetRequiredLabelRule implements CappedDeflectionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDeflectionBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped deflection budget. */
export class CappedDeflectionBudgetValidator {
  rules: CappedDeflectionBudgetRule[];

  constructor(rules: CappedDeflectionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDeflectionBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedDeflectionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDeflectionBudget[]): Map<string, string[]> {
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

export function defaultCappedDeflectionBudgetValidator(): CappedDeflectionBudgetValidator {
  return new CappedDeflectionBudgetValidator(
    [
      new CappedDeflectionBudgetCodePrefixRule("X"),
      new CappedDeflectionBudgetThresholdRangeRule(3.2, 991.4),
      new CappedDeflectionBudgetRequiredLabelRule("capped deflection budget needs an entry"),
    ],
  );
}
