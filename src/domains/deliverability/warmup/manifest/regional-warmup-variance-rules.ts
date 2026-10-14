import { RegionalWarmupVariance } from "./regional-warmup-variance.js";

/** A rule a regional warmup variance must pass. Check returns its problems, or none. */
export interface RegionalWarmupVarianceRule {
  check(item: RegionalWarmupVariance): string[];
}

export class RegionalWarmupVarianceTitleLengthRule implements RegionalWarmupVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalWarmupVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalWarmupVarianceEndsAtRangeRule implements RegionalWarmupVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalWarmupVariance): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalWarmupVarianceRequiredTitleRule implements RegionalWarmupVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalWarmupVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalWarmupVarianceRequiredCodeRule implements RegionalWarmupVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalWarmupVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalWarmupVarianceGraceDaysRangeRule implements RegionalWarmupVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalWarmupVariance): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalWarmupVarianceCodeLengthRule implements RegionalWarmupVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalWarmupVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional warmup variance. */
export class RegionalWarmupVarianceValidator {
  rules: RegionalWarmupVarianceRule[];

  constructor(rules: RegionalWarmupVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalWarmupVariance): string[] {
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

  requireValid(item: RegionalWarmupVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalWarmupVariance[]): Map<string, string[]> {
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

export function defaultRegionalWarmupVarianceValidator(): RegionalWarmupVarianceValidator {
  return new RegionalWarmupVarianceValidator(
    [
      new RegionalWarmupVarianceTitleLengthRule(255),
      new RegionalWarmupVarianceEndsAtRangeRule(16, 120),
      new RegionalWarmupVarianceRequiredTitleRule("regional warmup variance needs a value"),
      new RegionalWarmupVarianceRequiredCodeRule("regional warmup variance needs an entry"),
      new RegionalWarmupVarianceGraceDaysRangeRule(16, 1000),
      new RegionalWarmupVarianceCodeLengthRule(86400),
    ],
  );
}
