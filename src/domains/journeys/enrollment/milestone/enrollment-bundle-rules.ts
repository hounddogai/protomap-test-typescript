import * as text from "../../../../kit/text.js";
import { EnrollmentBundle } from "./enrollment-bundle.js";

/** A rule a enrollment bundle must pass. Check returns its problems, or none. */
export interface EnrollmentBundleRule {
  check(item: EnrollmentBundle): string[];
}

export class EnrollmentBundleSourceLengthRule implements EnrollmentBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentBundle): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentBundleTitleLengthRule implements EnrollmentBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentBundleRequiredCategoryRule implements EnrollmentBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentBundle): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentBundleCodePrefixRule implements EnrollmentBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentBundleAllowedSourceRule implements EnrollmentBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is above maximum`];
    return [];
  }
}

export class EnrollmentBundleRequiredTitleRule implements EnrollmentBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a enrollment bundle. */
export class EnrollmentBundleValidator {
  rules: EnrollmentBundleRule[];

  constructor(rules: EnrollmentBundleRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentBundle): string[] {
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

  requireValid(item: EnrollmentBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentBundle[]): Map<string, string[]> {
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

export function defaultEnrollmentBundleValidator(): EnrollmentBundleValidator {
  return new EnrollmentBundleValidator(
    [
      new EnrollmentBundleSourceLengthRule(32),
      new EnrollmentBundleTitleLengthRule(255),
      new EnrollmentBundleRequiredCategoryRule("enrollment bundle needs a value"),
      new EnrollmentBundleCodePrefixRule("X"),
      new EnrollmentBundleAllowedSourceRule([]),
      new EnrollmentBundleRequiredTitleRule("enrollment bundle needs this field"),
    ],
  );
}
