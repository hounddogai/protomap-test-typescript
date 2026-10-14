import { SubscriptionRollup } from "./subscription-rollup.js";

/** A rule a subscription rollup must pass. Check returns its problems, or none. */
export interface SubscriptionRollupRule {
  check(item: SubscriptionRollup): string[];
}

export class SubscriptionRollupCodeLengthRule implements SubscriptionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionRollupCampaignRefLengthRule implements SubscriptionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionRollup): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionRollupPriorityRangeRule implements SubscriptionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRollup): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionRollupExpiresAtRangeRule implements SubscriptionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRollup): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionRollupNameLengthRule implements SubscriptionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription rollup. */
export class SubscriptionRollupValidator {
  rules: SubscriptionRollupRule[];

  constructor(rules: SubscriptionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionRollup[]): Map<string, string[]> {
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

export function defaultSubscriptionRollupValidator(): SubscriptionRollupValidator {
  return new SubscriptionRollupValidator(
    [
      new SubscriptionRollupCodeLengthRule(1000),
      new SubscriptionRollupCampaignRefLengthRule(64),
      new SubscriptionRollupPriorityRangeRule(64, 3600),
      new SubscriptionRollupExpiresAtRangeRule(64, 120),
      new SubscriptionRollupNameLengthRule(86400),
    ],
  );
}
