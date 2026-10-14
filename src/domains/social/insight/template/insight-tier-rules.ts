import { InsightTier } from "./insight-tier.js";

/** A rule a insight tier must pass. Check returns its problems, or none. */
export interface InsightTierRule {
  check(item: InsightTier): string[];
}

export class InsightTierRetriesRangeRule implements InsightTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightTier): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightTierScoreRangeRule implements InsightTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightTier): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightTierRequiredVariantRule implements InsightTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightTier): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class InsightTierUtmSourceLengthRule implements InsightTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightTier): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightTierActiveGuardRule implements InsightTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InsightTier): string[] {
    if (item.active && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a insight tier. */
export class InsightTierValidator {
  rules: InsightTierRule[];

  constructor(rules: InsightTierRule[]) {
    this.rules = rules;
  }

  validate(item: InsightTier): string[] {
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

  requireValid(item: InsightTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightTier[]): Map<string, string[]> {
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

export function defaultInsightTierValidator(): InsightTierValidator {
  return new InsightTierValidator(
    [
      new InsightTierRetriesRangeRule(16, 3600),
      new InsightTierScoreRangeRule(2.9, 1266.4),
      new InsightTierRequiredVariantRule("insight tier needs an entry"),
      new InsightTierUtmSourceLengthRule(80),
      new InsightTierActiveGuardRule(6.3),
    ],
  );
}
