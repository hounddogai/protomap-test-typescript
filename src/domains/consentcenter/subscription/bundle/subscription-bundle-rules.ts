import { SubscriptionBundle } from "./subscription-bundle.js";

/** A rule a subscription bundle must pass. Check returns its problems, or none. */
export interface SubscriptionBundleRule {
  check(item: SubscriptionBundle): string[];
}

export class SubscriptionBundleMinimumRangeRule implements SubscriptionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionBundle): string[] {
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

export class SubscriptionBundleRequiredLabelRule implements SubscriptionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionBundleRequiredCountryRule implements SubscriptionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBundle): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription bundle. */
export class SubscriptionBundleValidator {
  rules: SubscriptionBundleRule[];

  constructor(rules: SubscriptionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionBundle[]): Map<string, string[]> {
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

export function defaultSubscriptionBundleValidator(): SubscriptionBundleValidator {
  return new SubscriptionBundleValidator(
    [
      new SubscriptionBundleMinimumRangeRule(0.2, 4031.9),
      new SubscriptionBundleRequiredLabelRule("subscription bundle needs this field"),
      new SubscriptionBundleRequiredCountryRule("subscription bundle needs an entry"),
    ],
  );
}
