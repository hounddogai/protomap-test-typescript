import { TieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

/** A rule a tiered reward rule threshold must pass. Check returns its problems, or none. */
export interface TieredRewardRuleThresholdRule {
  check(item: TieredRewardRuleThreshold): string[];
}

export class TieredRewardRuleThresholdScoreRangeRule implements TieredRewardRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleThreshold): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredRewardRuleThresholdCurrencyLengthRule implements TieredRewardRuleThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardRuleThreshold): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardRuleThresholdDescriptionLengthRule implements TieredRewardRuleThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardRuleThreshold): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardRuleThresholdRequiredCurrencyRule implements TieredRewardRuleThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleThreshold): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleThresholdBidRangeRule implements TieredRewardRuleThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleThreshold): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered reward rule threshold. */
export class TieredRewardRuleThresholdValidator {
  rules: TieredRewardRuleThresholdRule[];

  constructor(rules: TieredRewardRuleThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardRuleThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRewardRuleThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardRuleThreshold[]): Map<string, string[]> {
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

export function defaultTieredRewardRuleThresholdValidator(): TieredRewardRuleThresholdValidator {
  return new TieredRewardRuleThresholdValidator(
    [
      new TieredRewardRuleThresholdScoreRangeRule(1.1, 1563.4),
      new TieredRewardRuleThresholdCurrencyLengthRule(86400),
      new TieredRewardRuleThresholdDescriptionLengthRule(32),
      new TieredRewardRuleThresholdRequiredCurrencyRule("tiered reward rule threshold needs this field"),
      new TieredRewardRuleThresholdBidRangeRule(0.3, 3354.1),
    ],
  );
}
