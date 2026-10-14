import * as text from "../../../../kit/text.js";
import { CohortDigest } from "./cohort-digest.js";

/** A rule a cohort digest must pass. Check returns its problems, or none. */
export interface CohortDigestRule {
  check(item: CohortDigest): string[];
}

export class CohortDigestRequiredTitleRule implements CohortDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CohortDigestCodeLengthRule implements CohortDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortDigestTimezoneLengthRule implements CohortDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortDigest): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortDigestMarginRangeRule implements CohortDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortDigest): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortDigestAllowedTitleRule implements CohortDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class CohortDigestRequiredTimezoneRule implements CohortDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortDigest): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort digest. */
export class CohortDigestValidator {
  rules: CohortDigestRule[];

  constructor(rules: CohortDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CohortDigest): string[] {
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

  requireValid(item: CohortDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortDigest[]): Map<string, string[]> {
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

export function defaultCohortDigestValidator(): CohortDigestValidator {
  return new CohortDigestValidator(
    [
      new CohortDigestRequiredTitleRule("cohort digest needs this field"),
      new CohortDigestCodeLengthRule(32),
      new CohortDigestTimezoneLengthRule(16),
      new CohortDigestMarginRangeRule(7.9, 1745.9),
      new CohortDigestAllowedTitleRule(["fallback", "seasonal"]),
      new CohortDigestRequiredTimezoneRule("cohort digest needs an entry"),
    ],
  );
}
