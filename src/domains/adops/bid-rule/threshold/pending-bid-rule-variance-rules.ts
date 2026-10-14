import { PendingBidRuleVariance } from "./pending-bid-rule-variance.js";

/** A rule a pending bid rule variance must pass. Check returns its problems, or none. */
export interface PendingBidRuleVarianceRule {
  check(item: PendingBidRuleVariance): string[];
}

export class PendingBidRuleVarianceTitleLengthRule implements PendingBidRuleVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRuleVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRuleVarianceRatioRangeRule implements PendingBidRuleVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRuleVariance): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingBidRuleVarianceFrequencyCapRangeRule implements PendingBidRuleVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRuleVariance): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBidRuleVarianceActiveGuardRule implements PendingBidRuleVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingBidRuleVariance): string[] {
    if (item.active && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PendingBidRuleVarianceLimitRangeRule implements PendingBidRuleVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBidRuleVariance): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBidRuleVarianceRequiredTitleRule implements PendingBidRuleVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRuleVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending bid rule variance. */
export class PendingBidRuleVarianceValidator {
  rules: PendingBidRuleVarianceRule[];

  constructor(rules: PendingBidRuleVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRuleVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBidRuleVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRuleVariance[]): Map<string, string[]> {
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

export function defaultPendingBidRuleVarianceValidator(): PendingBidRuleVarianceValidator {
  return new PendingBidRuleVarianceValidator(
    [
      new PendingBidRuleVarianceTitleLengthRule(1000),
      new PendingBidRuleVarianceRatioRangeRule(4.3, 1795.3),
      new PendingBidRuleVarianceFrequencyCapRangeRule(16, 16),
      new PendingBidRuleVarianceActiveGuardRule(32),
      new PendingBidRuleVarianceLimitRangeRule(32, 1000),
      new PendingBidRuleVarianceRequiredTitleRule("pending bid rule variance needs a value"),
    ],
  );
}
