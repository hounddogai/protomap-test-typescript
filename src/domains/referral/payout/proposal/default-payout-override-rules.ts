import { DefaultPayoutOverride } from "./default-payout-override.js";

/** A rule a default payout override must pass. Check returns its problems, or none. */
export interface DefaultPayoutOverrideRule {
  check(item: DefaultPayoutOverride): string[];
}

export class DefaultPayoutOverrideCreatedAtRangeRule implements DefaultPayoutOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPayoutOverride): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPayoutOverrideAudienceIdLengthRule implements DefaultPayoutOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPayoutOverride): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPayoutOverrideCampaignRefLengthRule implements DefaultPayoutOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPayoutOverride): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default payout override. */
export class DefaultPayoutOverrideValidator {
  rules: DefaultPayoutOverrideRule[];

  constructor(rules: DefaultPayoutOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPayoutOverride): string[] {
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

  requireValid(item: DefaultPayoutOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPayoutOverride[]): Map<string, string[]> {
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

export function defaultDefaultPayoutOverrideValidator(): DefaultPayoutOverrideValidator {
  return new DefaultPayoutOverrideValidator(
    [
      new DefaultPayoutOverrideCreatedAtRangeRule(32, 64),
      new DefaultPayoutOverrideAudienceIdLengthRule(1000),
      new DefaultPayoutOverrideCampaignRefLengthRule(255),
    ],
  );
}
