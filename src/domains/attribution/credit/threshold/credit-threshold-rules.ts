import { CreditThreshold } from "./credit-threshold.js";

/** A rule a credit threshold must pass. Check returns its problems, or none. */
export interface CreditThresholdRule {
  check(item: CreditThreshold): string[];
}

export class CreditThresholdBudgetRangeRule implements CreditThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditThreshold): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditThresholdCodeLengthRule implements CreditThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditThresholdCodePrefixRule implements CreditThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit threshold. */
export class CreditThresholdValidator {
  rules: CreditThresholdRule[];

  constructor(rules: CreditThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CreditThreshold): string[] {
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

  requireValid(item: CreditThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditThreshold[]): Map<string, string[]> {
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

export function defaultCreditThresholdValidator(): CreditThresholdValidator {
  return new CreditThresholdValidator(
    [
      new CreditThresholdBudgetRangeRule(2.8, 4554.1),
      new CreditThresholdCodeLengthRule(1000),
      new CreditThresholdCodePrefixRule("X"),
    ],
  );
}
