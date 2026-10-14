import { RollingModelVariance } from "./rolling-model-variance.js";

/** A rule a rolling model variance must pass. Check returns its problems, or none. */
export interface RollingModelVarianceRule {
  check(item: RollingModelVariance): string[];
}

export class RollingModelVarianceExternalRefLengthRule implements RollingModelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingModelVariance): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingModelVarianceNameLengthRule implements RollingModelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingModelVariance): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingModelVarianceRequiredCodeRule implements RollingModelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingModelVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingModelVarianceExpiresAtRangeRule implements RollingModelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingModelVariance): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingModelVarianceBudgetRangeRule implements RollingModelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingModelVariance): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingModelVarianceCategoryLengthRule implements RollingModelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingModelVariance): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling model variance. */
export class RollingModelVarianceValidator {
  rules: RollingModelVarianceRule[];

  constructor(rules: RollingModelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingModelVariance): string[] {
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

  requireValid(item: RollingModelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingModelVariance[]): Map<string, string[]> {
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

export function defaultRollingModelVarianceValidator(): RollingModelVarianceValidator {
  return new RollingModelVarianceValidator(
    [
      new RollingModelVarianceExternalRefLengthRule(32),
      new RollingModelVarianceNameLengthRule(16),
      new RollingModelVarianceRequiredCodeRule("rolling model variance needs a value"),
      new RollingModelVarianceExpiresAtRangeRule(32, 86400),
      new RollingModelVarianceBudgetRangeRule(8, 4571.1),
      new RollingModelVarianceCategoryLengthRule(16),
    ],
  );
}
