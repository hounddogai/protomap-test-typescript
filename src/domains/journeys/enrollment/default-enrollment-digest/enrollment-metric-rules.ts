import * as text from "../../../../kit/text.js";
import { EnrollmentMetric } from "./enrollment-metric.js";

/** A rule a enrollment metric must pass. Check returns its problems, or none. */
export interface EnrollmentMetricRule {
  check(item: EnrollmentMetric): string[];
}

export class EnrollmentMetricCohortLengthRule implements EnrollmentMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentMetric): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentMetricCodePrefixRule implements EnrollmentMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentMetricMaximumRangeRule implements EnrollmentMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentMetric): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentMetricAllowedNameRule implements EnrollmentMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class EnrollmentMetricRequiredNameRule implements EnrollmentMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentMetricNameLengthRule implements EnrollmentMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment metric. */
export class EnrollmentMetricValidator {
  rules: EnrollmentMetricRule[];

  constructor(rules: EnrollmentMetricRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentMetric): string[] {
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

  requireValid(item: EnrollmentMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentMetric[]): Map<string, string[]> {
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

export function defaultEnrollmentMetricValidator(): EnrollmentMetricValidator {
  return new EnrollmentMetricValidator(
    [
      new EnrollmentMetricCohortLengthRule(32),
      new EnrollmentMetricCodePrefixRule("X"),
      new EnrollmentMetricMaximumRangeRule(9, 319.2),
      new EnrollmentMetricAllowedNameRule([]),
      new EnrollmentMetricRequiredNameRule("enrollment metric needs an entry"),
      new EnrollmentMetricNameLengthRule(1000),
    ],
  );
}
