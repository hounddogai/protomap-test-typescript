import { ManualBidRuleEstimate } from "./manual-bid-rule-estimate.js";

/** A rule a manual bid rule estimate must pass. Check returns its problems, or none. */
export interface ManualBidRuleEstimateRule {
  check(item: ManualBidRuleEstimate): string[];
}

export class ManualBidRuleEstimateOpenRateRangeRule implements ManualBidRuleEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleEstimate): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualBidRuleEstimateRequiredCodeRule implements ManualBidRuleEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBidRuleEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBidRuleEstimateTitleLengthRule implements ManualBidRuleEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBidRuleEstimateRequiredTitleRule implements ManualBidRuleEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBidRuleEstimate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBidRuleEstimateAttemptsRangeRule implements ManualBidRuleEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleEstimate): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualBidRuleEstimateScoreRangeRule implements ManualBidRuleEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleEstimate): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual bid rule estimate. */
export class ManualBidRuleEstimateValidator {
  rules: ManualBidRuleEstimateRule[];

  constructor(rules: ManualBidRuleEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBidRuleEstimate): string[] {
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

  requireValid(item: ManualBidRuleEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBidRuleEstimate[]): Map<string, string[]> {
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

export function defaultManualBidRuleEstimateValidator(): ManualBidRuleEstimateValidator {
  return new ManualBidRuleEstimateValidator(
    [
      new ManualBidRuleEstimateOpenRateRangeRule(0.2, 479.9),
      new ManualBidRuleEstimateRequiredCodeRule("manual bid rule estimate needs this field"),
      new ManualBidRuleEstimateTitleLengthRule(16),
      new ManualBidRuleEstimateRequiredTitleRule("manual bid rule estimate needs an entry"),
      new ManualBidRuleEstimateAttemptsRangeRule(16, 32),
      new ManualBidRuleEstimateScoreRangeRule(9.6, 4293.6),
    ],
  );
}
