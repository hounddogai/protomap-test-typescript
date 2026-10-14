import { SubscriptionDigest } from "./subscription-digest.js";

/** A rule a subscription digest must pass. Check returns its problems, or none. */
export interface SubscriptionDigestRule {
  check(item: SubscriptionDigest): string[];
}

export class SubscriptionDigestRequiredSourceRule implements SubscriptionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionDigest): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionDigestCodeLengthRule implements SubscriptionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionDigestRequiredCodeRule implements SubscriptionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionDigestCapacityRangeRule implements SubscriptionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionDigest): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionDigestWeightRangeRule implements SubscriptionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionDigest): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionDigestNameLengthRule implements SubscriptionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription digest. */
export class SubscriptionDigestValidator {
  rules: SubscriptionDigestRule[];

  constructor(rules: SubscriptionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionDigest): string[] {
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

  requireValid(item: SubscriptionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionDigest[]): Map<string, string[]> {
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

export function defaultSubscriptionDigestValidator(): SubscriptionDigestValidator {
  return new SubscriptionDigestValidator(
    [
      new SubscriptionDigestRequiredSourceRule("subscription digest needs a value"),
      new SubscriptionDigestCodeLengthRule(1000),
      new SubscriptionDigestRequiredCodeRule("subscription digest needs this field"),
      new SubscriptionDigestCapacityRangeRule(64, 1000),
      new SubscriptionDigestWeightRangeRule(0.2, 1843.4),
      new SubscriptionDigestNameLengthRule(64),
    ],
  );
}
