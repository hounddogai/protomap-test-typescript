import { RegionalBranchDigest } from "./regional-branch-digest.js";

/** A rule a regional branch digest must pass. Check returns its problems, or none. */
export interface RegionalBranchDigestRule {
  check(item: RegionalBranchDigest): string[];
}

export class RegionalBranchDigestRequiredChannelRule implements RegionalBranchDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalBranchDigest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalBranchDigestBudgetRangeRule implements RegionalBranchDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBranchDigest): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalBranchDigestActiveGuardRule implements RegionalBranchDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalBranchDigest): string[] {
    if (item.active && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RegionalBranchDigestMaximumRangeRule implements RegionalBranchDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBranchDigest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalBranchDigestConversionRateRangeRule implements RegionalBranchDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBranchDigest): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalBranchDigestCodePrefixRule implements RegionalBranchDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalBranchDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional branch digest. */
export class RegionalBranchDigestValidator {
  rules: RegionalBranchDigestRule[];

  constructor(rules: RegionalBranchDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBranchDigest): string[] {
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

  requireValid(item: RegionalBranchDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBranchDigest[]): Map<string, string[]> {
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

export function defaultRegionalBranchDigestValidator(): RegionalBranchDigestValidator {
  return new RegionalBranchDigestValidator(
    [
      new RegionalBranchDigestRequiredChannelRule("regional branch digest needs an entry"),
      new RegionalBranchDigestBudgetRangeRule(0.1, 4599.2),
      new RegionalBranchDigestActiveGuardRule(32),
      new RegionalBranchDigestMaximumRangeRule(9.6, 2258.1),
      new RegionalBranchDigestConversionRateRangeRule(1.2, 3229.9),
      new RegionalBranchDigestCodePrefixRule("Q"),
    ],
  );
}
