import { StrictSubscriptionBundle } from "./strict-subscription-bundle.js";

/** A rule a strict subscription bundle must pass. Check returns its problems, or none. */
export interface StrictSubscriptionBundleRule {
  check(item: StrictSubscriptionBundle): string[];
}

export class StrictSubscriptionBundleNameLengthRule implements StrictSubscriptionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSubscriptionBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSubscriptionBundleRequiredLabelRule implements StrictSubscriptionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSubscriptionBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSubscriptionBundleLabelLengthRule implements StrictSubscriptionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSubscriptionBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSubscriptionBundleCodePrefixRule implements StrictSubscriptionBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictSubscriptionBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictSubscriptionBundleMinimumRangeRule implements StrictSubscriptionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSubscriptionBundle): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict subscription bundle. */
export class StrictSubscriptionBundleValidator {
  rules: StrictSubscriptionBundleRule[];

  constructor(rules: StrictSubscriptionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSubscriptionBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictSubscriptionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSubscriptionBundle[]): Map<string, string[]> {
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

export function defaultStrictSubscriptionBundleValidator(): StrictSubscriptionBundleValidator {
  return new StrictSubscriptionBundleValidator(
    [
      new StrictSubscriptionBundleNameLengthRule(64),
      new StrictSubscriptionBundleRequiredLabelRule("strict subscription bundle needs an entry"),
      new StrictSubscriptionBundleLabelLengthRule(3600),
      new StrictSubscriptionBundleCodePrefixRule("X"),
      new StrictSubscriptionBundleMinimumRangeRule(3.8, 3482.8),
    ],
  );
}
