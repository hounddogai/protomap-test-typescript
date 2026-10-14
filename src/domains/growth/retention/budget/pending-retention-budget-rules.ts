import { PendingRetentionBudget } from "./pending-retention-budget.js";

/** A rule a pending retention budget must pass. Check returns its problems, or none. */
export interface PendingRetentionBudgetRule {
  check(item: PendingRetentionBudget): string[];
}

export class PendingRetentionBudgetRequiredTimezoneRule implements PendingRetentionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRetentionBudget): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRetentionBudgetAttemptsRangeRule implements PendingRetentionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRetentionBudget): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRetentionBudgetCodePrefixRule implements PendingRetentionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingRetentionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingRetentionBudgetTimezoneLengthRule implements PendingRetentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRetentionBudget): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRetentionBudgetRegionLengthRule implements PendingRetentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRetentionBudget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending retention budget. */
export class PendingRetentionBudgetValidator {
  rules: PendingRetentionBudgetRule[];

  constructor(rules: PendingRetentionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRetentionBudget): string[] {
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

  requireValid(item: PendingRetentionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRetentionBudget[]): Map<string, string[]> {
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

export function defaultPendingRetentionBudgetValidator(): PendingRetentionBudgetValidator {
  return new PendingRetentionBudgetValidator(
    [
      new PendingRetentionBudgetRequiredTimezoneRule("pending retention budget needs an entry"),
      new PendingRetentionBudgetAttemptsRangeRule(16, 120),
      new PendingRetentionBudgetCodePrefixRule("OPS"),
      new PendingRetentionBudgetTimezoneLengthRule(3600),
      new PendingRetentionBudgetRegionLengthRule(1000),
    ],
  );
}
