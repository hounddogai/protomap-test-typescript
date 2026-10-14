import { AdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

/** A rule a adaptive deflection budget must pass. Check returns its problems, or none. */
export interface AdaptiveDeflectionBudgetRule {
  check(item: AdaptiveDeflectionBudget): string[];
}

export class AdaptiveDeflectionBudgetSendAtRangeRule implements AdaptiveDeflectionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDeflectionBudget): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveDeflectionBudgetRequiredCodeRule implements AdaptiveDeflectionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDeflectionBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDeflectionBudgetStartsAtRangeRule implements AdaptiveDeflectionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDeflectionBudget): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveDeflectionBudgetCodePrefixRule implements AdaptiveDeflectionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveDeflectionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive deflection budget. */
export class AdaptiveDeflectionBudgetValidator {
  rules: AdaptiveDeflectionBudgetRule[];

  constructor(rules: AdaptiveDeflectionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDeflectionBudget): string[] {
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

  requireValid(item: AdaptiveDeflectionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDeflectionBudget[]): Map<string, string[]> {
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

export function defaultAdaptiveDeflectionBudgetValidator(): AdaptiveDeflectionBudgetValidator {
  return new AdaptiveDeflectionBudgetValidator(
    [
      new AdaptiveDeflectionBudgetSendAtRangeRule(16, 255),
      new AdaptiveDeflectionBudgetRequiredCodeRule("adaptive deflection budget needs an entry"),
      new AdaptiveDeflectionBudgetStartsAtRangeRule(32, 255),
      new AdaptiveDeflectionBudgetCodePrefixRule("ACM"),
    ],
  );
}
