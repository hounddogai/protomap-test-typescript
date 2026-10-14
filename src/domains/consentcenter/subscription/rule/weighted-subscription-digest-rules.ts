import { WeightedSubscriptionDigest } from "./weighted-subscription-digest.js";

/** A rule a weighted subscription digest must pass. Check returns its problems, or none. */
export interface WeightedSubscriptionDigestRule {
  check(item: WeightedSubscriptionDigest): string[];
}

export class WeightedSubscriptionDigestRequiredNameRule implements WeightedSubscriptionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSubscriptionDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedSubscriptionDigestVersionRangeRule implements WeightedSubscriptionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSubscriptionDigest): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedSubscriptionDigestNameLengthRule implements WeightedSubscriptionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSubscriptionDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted subscription digest. */
export class WeightedSubscriptionDigestValidator {
  rules: WeightedSubscriptionDigestRule[];

  constructor(rules: WeightedSubscriptionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSubscriptionDigest): string[] {
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

  requireValid(item: WeightedSubscriptionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSubscriptionDigest[]): Map<string, string[]> {
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

export function defaultWeightedSubscriptionDigestValidator(): WeightedSubscriptionDigestValidator {
  return new WeightedSubscriptionDigestValidator(
    [
      new WeightedSubscriptionDigestRequiredNameRule("weighted subscription digest needs this field"),
      new WeightedSubscriptionDigestVersionRangeRule(16, 3600),
      new WeightedSubscriptionDigestNameLengthRule(1000),
    ],
  );
}
