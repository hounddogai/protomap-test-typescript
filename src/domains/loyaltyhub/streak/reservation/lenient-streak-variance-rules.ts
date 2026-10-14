import { LenientStreakVariance } from "./lenient-streak-variance.js";

/** A rule a lenient streak variance must pass. Check returns its problems, or none. */
export interface LenientStreakVarianceRule {
  check(item: LenientStreakVariance): string[];
}

export class LenientStreakVarianceRequiredTitleRule implements LenientStreakVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakVarianceBudgetRangeRule implements LenientStreakVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientStreakVariance): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientStreakVarianceOwnerIdLengthRule implements LenientStreakVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakVariance): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStreakVarianceCodePrefixRule implements LenientStreakVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientStreakVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientStreakVarianceRequiredOwnerIdRule implements LenientStreakVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakVariance): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient streak variance. */
export class LenientStreakVarianceValidator {
  rules: LenientStreakVarianceRule[];

  constructor(rules: LenientStreakVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStreakVariance): string[] {
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

  requireValid(item: LenientStreakVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStreakVariance[]): Map<string, string[]> {
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

export function defaultLenientStreakVarianceValidator(): LenientStreakVarianceValidator {
  return new LenientStreakVarianceValidator(
    [
      new LenientStreakVarianceRequiredTitleRule("lenient streak variance needs a value"),
      new LenientStreakVarianceBudgetRangeRule(9.3, 4230.3),
      new LenientStreakVarianceOwnerIdLengthRule(255),
      new LenientStreakVarianceCodePrefixRule("Q"),
      new LenientStreakVarianceRequiredOwnerIdRule("lenient streak variance needs an entry"),
    ],
  );
}
