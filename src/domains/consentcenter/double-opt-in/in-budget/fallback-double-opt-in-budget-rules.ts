import { FallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

/** A rule a fallback double opt in budget must pass. Check returns its problems, or none. */
export interface FallbackDoubleOptInBudgetRule {
  check(item: FallbackDoubleOptInBudget): string[];
}

export class FallbackDoubleOptInBudgetChecksumLengthRule implements FallbackDoubleOptInBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDoubleOptInBudget): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackDoubleOptInBudgetCodePrefixRule implements FallbackDoubleOptInBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackDoubleOptInBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackDoubleOptInBudgetCodeLengthRule implements FallbackDoubleOptInBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDoubleOptInBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback double opt in budget. */
export class FallbackDoubleOptInBudgetValidator {
  rules: FallbackDoubleOptInBudgetRule[];

  constructor(rules: FallbackDoubleOptInBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackDoubleOptInBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackDoubleOptInBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackDoubleOptInBudget[]): Map<string, string[]> {
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

export function defaultFallbackDoubleOptInBudgetValidator(): FallbackDoubleOptInBudgetValidator {
  return new FallbackDoubleOptInBudgetValidator(
    [
      new FallbackDoubleOptInBudgetChecksumLengthRule(86400),
      new FallbackDoubleOptInBudgetCodePrefixRule("X"),
      new FallbackDoubleOptInBudgetCodeLengthRule(16),
    ],
  );
}
