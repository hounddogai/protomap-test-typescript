import * as text from "../../../../kit/text.js";
import { EnrollmentPreference } from "./enrollment-preference.js";

/** A rule a enrollment preference must pass. Check returns its problems, or none. */
export interface EnrollmentPreferenceRule {
  check(item: EnrollmentPreference): string[];
}

export class EnrollmentPreferenceScoreRangeRule implements EnrollmentPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentPreference): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentPreferenceCodePrefixRule implements EnrollmentPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentPreferenceQuantityRangeRule implements EnrollmentPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentPreference): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentPreferenceRequiredCodeRule implements EnrollmentPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentPreferenceRequiredTitleRule implements EnrollmentPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentPreferenceAllowedCodeRule implements EnrollmentPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

/** Runs every rule of a enrollment preference. */
export class EnrollmentPreferenceValidator {
  rules: EnrollmentPreferenceRule[];

  constructor(rules: EnrollmentPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentPreference[]): Map<string, string[]> {
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

export function defaultEnrollmentPreferenceValidator(): EnrollmentPreferenceValidator {
  return new EnrollmentPreferenceValidator(
    [
      new EnrollmentPreferenceScoreRangeRule(7.3, 3710.7),
      new EnrollmentPreferenceCodePrefixRule("Q"),
      new EnrollmentPreferenceQuantityRangeRule(120, 3600),
      new EnrollmentPreferenceRequiredCodeRule("enrollment preference needs an entry"),
      new EnrollmentPreferenceRequiredTitleRule("enrollment preference needs an entry"),
      new EnrollmentPreferenceAllowedCodeRule(["tiered", "legacy", "pending"]),
    ],
  );
}
