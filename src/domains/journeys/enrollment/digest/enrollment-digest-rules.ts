import * as text from "../../../../kit/text.js";
import { EnrollmentDigest } from "./enrollment-digest.js";

/** A rule a enrollment digest must pass. Check returns its problems, or none. */
export interface EnrollmentDigestRule {
  check(item: EnrollmentDigest): string[];
}

export class EnrollmentDigestLabelLengthRule implements EnrollmentDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentDigestLimitRangeRule implements EnrollmentDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentDigest): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentDigestAllowedRegionRule implements EnrollmentDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is above maximum`];
    return [];
  }
}

export class EnrollmentDigestRegionLengthRule implements EnrollmentDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentDigest): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentDigestRequiredNameRule implements EnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentDigestRequiredLabelRule implements EnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a enrollment digest. */
export class EnrollmentDigestValidator {
  rules: EnrollmentDigestRule[];

  constructor(rules: EnrollmentDigestRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentDigest[]): Map<string, string[]> {
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

export function defaultEnrollmentDigestValidator(): EnrollmentDigestValidator {
  return new EnrollmentDigestValidator(
    [
      new EnrollmentDigestLabelLengthRule(64),
      new EnrollmentDigestLimitRangeRule(16, 86400),
      new EnrollmentDigestAllowedRegionRule(["rolling", "default", "lenient"]),
      new EnrollmentDigestRegionLengthRule(16),
      new EnrollmentDigestRequiredNameRule("enrollment digest needs a value"),
      new EnrollmentDigestRequiredLabelRule("enrollment digest needs this field"),
    ],
  );
}
