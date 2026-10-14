import { RollingSubscriptionBundle } from "./rolling-subscription-bundle.js";

/** A rule a rolling subscription bundle must pass. Check returns its problems, or none. */
export interface RollingSubscriptionBundleRule {
  check(item: RollingSubscriptionBundle): string[];
}

export class RollingSubscriptionBundleNameLengthRule implements RollingSubscriptionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSubscriptionBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSubscriptionBundleConversionRateRangeRule implements RollingSubscriptionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSubscriptionBundle): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSubscriptionBundleActiveGuardRule implements RollingSubscriptionBundleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingSubscriptionBundle): string[] {
    if (item.active && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RollingSubscriptionBundleRequiredReviewerRule implements RollingSubscriptionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionBundle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSubscriptionBundleCodeLengthRule implements RollingSubscriptionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSubscriptionBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling subscription bundle. */
export class RollingSubscriptionBundleValidator {
  rules: RollingSubscriptionBundleRule[];

  constructor(rules: RollingSubscriptionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSubscriptionBundle): string[] {
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

  requireValid(item: RollingSubscriptionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSubscriptionBundle[]): Map<string, string[]> {
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

export function defaultRollingSubscriptionBundleValidator(): RollingSubscriptionBundleValidator {
  return new RollingSubscriptionBundleValidator(
    [
      new RollingSubscriptionBundleNameLengthRule(86400),
      new RollingSubscriptionBundleConversionRateRangeRule(2.5, 4124.3),
      new RollingSubscriptionBundleActiveGuardRule(1.8),
      new RollingSubscriptionBundleRequiredReviewerRule("rolling subscription bundle needs a value"),
      new RollingSubscriptionBundleCodeLengthRule(32),
    ],
  );
}
