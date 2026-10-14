import { GlobalFrequencyBudget } from "./global-frequency-budget.js";

/** A rule a global frequency budget must pass. Check returns its problems, or none. */
export interface GlobalFrequencyBudgetRule {
  check(item: GlobalFrequencyBudget): string[];
}

export class GlobalFrequencyBudgetVisibleGuardRule implements GlobalFrequencyBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalFrequencyBudget): string[] {
    if (item.visible && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class GlobalFrequencyBudgetRatioRangeRule implements GlobalFrequencyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFrequencyBudget): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalFrequencyBudgetCapacityRangeRule implements GlobalFrequencyBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFrequencyBudget): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalFrequencyBudgetCodePrefixRule implements GlobalFrequencyBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalFrequencyBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalFrequencyBudgetRequiredCohortRule implements GlobalFrequencyBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFrequencyBudget): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global frequency budget. */
export class GlobalFrequencyBudgetValidator {
  rules: GlobalFrequencyBudgetRule[];

  constructor(rules: GlobalFrequencyBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFrequencyBudget): string[] {
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

  requireValid(item: GlobalFrequencyBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFrequencyBudget[]): Map<string, string[]> {
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

export function defaultGlobalFrequencyBudgetValidator(): GlobalFrequencyBudgetValidator {
  return new GlobalFrequencyBudgetValidator(
    [
      new GlobalFrequencyBudgetVisibleGuardRule(3600),
      new GlobalFrequencyBudgetRatioRangeRule(2.4, 901.7),
      new GlobalFrequencyBudgetCapacityRangeRule(16, 32),
      new GlobalFrequencyBudgetCodePrefixRule("X"),
      new GlobalFrequencyBudgetRequiredCohortRule("global frequency budget needs an entry"),
    ],
  );
}
