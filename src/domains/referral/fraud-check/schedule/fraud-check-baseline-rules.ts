import { FraudCheckBaseline } from "./fraud-check-baseline.js";

/** A rule a fraud check baseline must pass. Check returns its problems, or none. */
export interface FraudCheckBaselineRule {
  check(item: FraudCheckBaseline): string[];
}

export class FraudCheckBaselineCodePrefixRule implements FraudCheckBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckBaselineRequiredNotesRule implements FraudCheckBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckBaseline): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckBaselineRequiredLabelRule implements FraudCheckBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckBaselineCodeLengthRule implements FraudCheckBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckBaselineBudgetRangeRule implements FraudCheckBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckBaseline): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckBaselineNotesLengthRule implements FraudCheckBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckBaseline): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fraud check baseline. */
export class FraudCheckBaselineValidator {
  rules: FraudCheckBaselineRule[];

  constructor(rules: FraudCheckBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckBaseline): string[] {
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

  requireValid(item: FraudCheckBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckBaseline[]): Map<string, string[]> {
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

export function defaultFraudCheckBaselineValidator(): FraudCheckBaselineValidator {
  return new FraudCheckBaselineValidator(
    [
      new FraudCheckBaselineCodePrefixRule("ACM"),
      new FraudCheckBaselineRequiredNotesRule("fraud check baseline needs an entry"),
      new FraudCheckBaselineRequiredLabelRule("fraud check baseline needs an entry"),
      new FraudCheckBaselineCodeLengthRule(16),
      new FraudCheckBaselineBudgetRangeRule(3.3, 3623.4),
      new FraudCheckBaselineNotesLengthRule(86400),
    ],
  );
}
