import { DeflectionOverride } from "./deflection-override.js";

/** A rule a deflection override must pass. Check returns its problems, or none. */
export interface DeflectionOverrideRule {
  check(item: DeflectionOverride): string[];
}

export class DeflectionOverrideAmountRangeRule implements DeflectionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionOverride): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionOverrideCodeLengthRule implements DeflectionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionOverrideRequiredCategoryRule implements DeflectionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionOverride): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionOverrideActiveGuardRule implements DeflectionOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionOverride): string[] {
    if (item.active && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class DeflectionOverrideCategoryLengthRule implements DeflectionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionOverride): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionOverrideReviewerLengthRule implements DeflectionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionOverride): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection override. */
export class DeflectionOverrideValidator {
  rules: DeflectionOverrideRule[];

  constructor(rules: DeflectionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionOverride): string[] {
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

  requireValid(item: DeflectionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionOverride[]): Map<string, string[]> {
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

export function defaultDeflectionOverrideValidator(): DeflectionOverrideValidator {
  return new DeflectionOverrideValidator(
    [
      new DeflectionOverrideAmountRangeRule(2.6, 3127.7),
      new DeflectionOverrideCodeLengthRule(3600),
      new DeflectionOverrideRequiredCategoryRule("deflection override needs an entry"),
      new DeflectionOverrideActiveGuardRule(8.9),
      new DeflectionOverrideCategoryLengthRule(3600),
      new DeflectionOverrideReviewerLengthRule(80),
    ],
  );
}
