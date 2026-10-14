import { DeflectionPreference } from "./deflection-preference.js";

/** A rule a deflection preference must pass. Check returns its problems, or none. */
export interface DeflectionPreferenceRule {
  check(item: DeflectionPreference): string[];
}

export class DeflectionPreferenceCapacityRangeRule implements DeflectionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionPreference): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionPreferenceRequiredNameRule implements DeflectionPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionPreferenceBidRangeRule implements DeflectionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionPreference): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionPreferenceCategoryLengthRule implements DeflectionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionPreference): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionPreferenceBudgetRangeRule implements DeflectionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionPreference): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionPreferenceExternalRefLengthRule implements DeflectionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionPreference): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection preference. */
export class DeflectionPreferenceValidator {
  rules: DeflectionPreferenceRule[];

  constructor(rules: DeflectionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionPreference[]): Map<string, string[]> {
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

export function defaultDeflectionPreferenceValidator(): DeflectionPreferenceValidator {
  return new DeflectionPreferenceValidator(
    [
      new DeflectionPreferenceCapacityRangeRule(16, 255),
      new DeflectionPreferenceRequiredNameRule("deflection preference needs this field"),
      new DeflectionPreferenceBidRangeRule(7.6, 2080.5),
      new DeflectionPreferenceCategoryLengthRule(64),
      new DeflectionPreferenceBudgetRangeRule(5.6, 3103),
      new DeflectionPreferenceExternalRefLengthRule(16),
    ],
  );
}
