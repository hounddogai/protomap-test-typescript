import { SubscriptionVariance } from "./subscription-variance.js";

/** A rule a subscription variance must pass. Check returns its problems, or none. */
export interface SubscriptionVarianceRule {
  check(item: SubscriptionVariance): string[];
}

export class SubscriptionVarianceSourceLengthRule implements SubscriptionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionVariance): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionVarianceMinimumRangeRule implements SubscriptionVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionVariance): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionVarianceTimezoneLengthRule implements SubscriptionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionVariance): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionVarianceCodeLengthRule implements SubscriptionVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription variance. */
export class SubscriptionVarianceValidator {
  rules: SubscriptionVarianceRule[];

  constructor(rules: SubscriptionVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionVariance[]): Map<string, string[]> {
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

export function defaultSubscriptionVarianceValidator(): SubscriptionVarianceValidator {
  return new SubscriptionVarianceValidator(
    [
      new SubscriptionVarianceSourceLengthRule(86400),
      new SubscriptionVarianceMinimumRangeRule(5.7, 2632.9),
      new SubscriptionVarianceTimezoneLengthRule(80),
      new SubscriptionVarianceCodeLengthRule(64),
    ],
  );
}
