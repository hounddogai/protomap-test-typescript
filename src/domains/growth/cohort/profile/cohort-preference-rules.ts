import * as text from "../../../../kit/text.js";
import { CohortPreference } from "./cohort-preference.js";

/** A rule a cohort preference must pass. Check returns its problems, or none. */
export interface CohortPreferenceRule {
  check(item: CohortPreference): string[];
}

export class CohortPreferenceAllowedTitleRule implements CohortPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class CohortPreferenceWeightRangeRule implements CohortPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortPreference): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortPreferenceCreatedAtRangeRule implements CohortPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortPreference): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortPreferenceDiscountRangeRule implements CohortPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortPreference): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a cohort preference. */
export class CohortPreferenceValidator {
  rules: CohortPreferenceRule[];

  constructor(rules: CohortPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: CohortPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortPreference[]): Map<string, string[]> {
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

export function defaultCohortPreferenceValidator(): CohortPreferenceValidator {
  return new CohortPreferenceValidator(
    [
      new CohortPreferenceAllowedTitleRule(["seasonal"]),
      new CohortPreferenceWeightRangeRule(6.5, 3553.2),
      new CohortPreferenceCreatedAtRangeRule(64, 86400),
      new CohortPreferenceDiscountRangeRule(8.1, 4378.5),
    ],
  );
}
