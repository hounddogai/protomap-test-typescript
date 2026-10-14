import { LegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

/** A rule a legacy subscription bundle must pass. Check returns its problems, or none. */
export interface LegacySubscriptionBundleRule {
  check(item: LegacySubscriptionBundle): string[];
}

export class LegacySubscriptionBundleRequiredCodeRule implements LegacySubscriptionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySubscriptionBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySubscriptionBundleLocaleLengthRule implements LegacySubscriptionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySubscriptionBundle): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySubscriptionBundleDiscountRangeRule implements LegacySubscriptionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySubscriptionBundle): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy subscription bundle. */
export class LegacySubscriptionBundleValidator {
  rules: LegacySubscriptionBundleRule[];

  constructor(rules: LegacySubscriptionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySubscriptionBundle): string[] {
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

  requireValid(item: LegacySubscriptionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySubscriptionBundle[]): Map<string, string[]> {
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

export function defaultLegacySubscriptionBundleValidator(): LegacySubscriptionBundleValidator {
  return new LegacySubscriptionBundleValidator(
    [
      new LegacySubscriptionBundleRequiredCodeRule("legacy subscription bundle needs a value"),
      new LegacySubscriptionBundleLocaleLengthRule(64),
      new LegacySubscriptionBundleDiscountRangeRule(6.9, 1456.4),
    ],
  );
}
