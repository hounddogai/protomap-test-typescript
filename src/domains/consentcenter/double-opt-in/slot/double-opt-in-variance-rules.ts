import { DoubleOptInVariance } from "./double-opt-in-variance.js";

/** A rule a double opt in variance must pass. Check returns its problems, or none. */
export interface DoubleOptInVarianceRule {
  check(item: DoubleOptInVariance): string[];
}

export class DoubleOptInVarianceRequiredLocaleRule implements DoubleOptInVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInVariance): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInVarianceCodeLengthRule implements DoubleOptInVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInVarianceExpiresAtRangeRule implements DoubleOptInVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInVariance): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInVarianceLimitRangeRule implements DoubleOptInVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInVariance): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInVarianceRequiredTitleRule implements DoubleOptInVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInVarianceCategoryLengthRule implements DoubleOptInVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInVariance): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in variance. */
export class DoubleOptInVarianceValidator {
  rules: DoubleOptInVarianceRule[];

  constructor(rules: DoubleOptInVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInVariance[]): Map<string, string[]> {
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

export function defaultDoubleOptInVarianceValidator(): DoubleOptInVarianceValidator {
  return new DoubleOptInVarianceValidator(
    [
      new DoubleOptInVarianceRequiredLocaleRule("double opt in variance needs a value"),
      new DoubleOptInVarianceCodeLengthRule(86400),
      new DoubleOptInVarianceExpiresAtRangeRule(80, 120),
      new DoubleOptInVarianceLimitRangeRule(80, 1000),
      new DoubleOptInVarianceRequiredTitleRule("double opt in variance needs a value"),
      new DoubleOptInVarianceCategoryLengthRule(3600),
    ],
  );
}
