import { FallbackBadgeDigest } from "./fallback-badge-digest.js";

/** A rule a fallback badge digest must pass. Check returns its problems, or none. */
export interface FallbackBadgeDigestRule {
  check(item: FallbackBadgeDigest): string[];
}

export class FallbackBadgeDigestRequiredCodeRule implements FallbackBadgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBadgeDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBadgeDigestCategoryLengthRule implements FallbackBadgeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBadgeDigest): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBadgeDigestThresholdRangeRule implements FallbackBadgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackBadgeDigest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackBadgeDigestRequiredLocaleRule implements FallbackBadgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackBadgeDigest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackBadgeDigestLabelLengthRule implements FallbackBadgeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBadgeDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackBadgeDigestLocaleLengthRule implements FallbackBadgeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackBadgeDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback badge digest. */
export class FallbackBadgeDigestValidator {
  rules: FallbackBadgeDigestRule[];

  constructor(rules: FallbackBadgeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackBadgeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackBadgeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackBadgeDigest[]): Map<string, string[]> {
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

export function defaultFallbackBadgeDigestValidator(): FallbackBadgeDigestValidator {
  return new FallbackBadgeDigestValidator(
    [
      new FallbackBadgeDigestRequiredCodeRule("fallback badge digest needs an entry"),
      new FallbackBadgeDigestCategoryLengthRule(64),
      new FallbackBadgeDigestThresholdRangeRule(2.4, 3000.9),
      new FallbackBadgeDigestRequiredLocaleRule("fallback badge digest needs this field"),
      new FallbackBadgeDigestLabelLengthRule(16),
      new FallbackBadgeDigestLocaleLengthRule(80),
    ],
  );
}
