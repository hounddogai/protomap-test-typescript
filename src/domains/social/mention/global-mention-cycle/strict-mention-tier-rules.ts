import { StrictMentionTier } from "./strict-mention-tier.js";

/** A rule a strict mention tier must pass. Check returns its problems, or none. */
export interface StrictMentionTierRule {
  check(item: StrictMentionTier): string[];
}

export class StrictMentionTierOpenRateRangeRule implements StrictMentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMentionTier): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictMentionTierCeilingRangeRule implements StrictMentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMentionTier): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictMentionTierRatioRangeRule implements StrictMentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMentionTier): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictMentionTierRegionLengthRule implements StrictMentionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictMentionTier): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict mention tier. */
export class StrictMentionTierValidator {
  rules: StrictMentionTierRule[];

  constructor(rules: StrictMentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: StrictMentionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictMentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictMentionTier[]): Map<string, string[]> {
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

export function defaultStrictMentionTierValidator(): StrictMentionTierValidator {
  return new StrictMentionTierValidator(
    [
      new StrictMentionTierOpenRateRangeRule(6.2, 4001.2),
      new StrictMentionTierCeilingRangeRule(6.7, 625.1),
      new StrictMentionTierRatioRangeRule(1.1, 1112.8),
      new StrictMentionTierRegionLengthRule(64),
    ],
  );
}
