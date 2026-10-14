import { RegionalStreakTier } from "./regional-streak-tier.js";

/** A rule a regional streak tier must pass. Check returns its problems, or none. */
export interface RegionalStreakTierRule {
  check(item: RegionalStreakTier): string[];
}

export class RegionalStreakTierRequiredTitleRule implements RegionalStreakTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStreakTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStreakTierBatchSizeRangeRule implements RegionalStreakTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStreakTier): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalStreakTierContactEmailLengthRule implements RegionalStreakTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStreakTier): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalStreakTierCodeLengthRule implements RegionalStreakTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalStreakTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional streak tier. */
export class RegionalStreakTierValidator {
  rules: RegionalStreakTierRule[];

  constructor(rules: RegionalStreakTierRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalStreakTier): string[] {
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

  requireValid(item: RegionalStreakTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalStreakTier[]): Map<string, string[]> {
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

export function defaultRegionalStreakTierValidator(): RegionalStreakTierValidator {
  return new RegionalStreakTierValidator(
    [
      new RegionalStreakTierRequiredTitleRule("regional streak tier needs an entry"),
      new RegionalStreakTierBatchSizeRangeRule(80, 1000),
      new RegionalStreakTierContactEmailLengthRule(64),
      new RegionalStreakTierCodeLengthRule(64),
    ],
  );
}
