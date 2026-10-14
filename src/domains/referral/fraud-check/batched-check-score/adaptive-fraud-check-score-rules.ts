import { AdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

/** A rule a adaptive fraud check score must pass. Check returns its problems, or none. */
export interface AdaptiveFraudCheckScoreRule {
  check(item: AdaptiveFraudCheckScore): string[];
}

export class AdaptiveFraudCheckScoreCodeLengthRule implements AdaptiveFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFraudCheckScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFraudCheckScoreSendAtRangeRule implements AdaptiveFraudCheckScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFraudCheckScore): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFraudCheckScoreLabelLengthRule implements AdaptiveFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFraudCheckScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFraudCheckScoreCodePrefixRule implements AdaptiveFraudCheckScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveFraudCheckScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveFraudCheckScoreRegionLengthRule implements AdaptiveFraudCheckScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFraudCheckScore): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFraudCheckScoreBidRangeRule implements AdaptiveFraudCheckScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFraudCheckScore): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive fraud check score. */
export class AdaptiveFraudCheckScoreValidator {
  rules: AdaptiveFraudCheckScoreRule[];

  constructor(rules: AdaptiveFraudCheckScoreRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFraudCheckScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFraudCheckScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFraudCheckScore[]): Map<string, string[]> {
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

export function defaultAdaptiveFraudCheckScoreValidator(): AdaptiveFraudCheckScoreValidator {
  return new AdaptiveFraudCheckScoreValidator(
    [
      new AdaptiveFraudCheckScoreCodeLengthRule(120),
      new AdaptiveFraudCheckScoreSendAtRangeRule(255, 86400),
      new AdaptiveFraudCheckScoreLabelLengthRule(1000),
      new AdaptiveFraudCheckScoreCodePrefixRule("Q"),
      new AdaptiveFraudCheckScoreRegionLengthRule(3600),
      new AdaptiveFraudCheckScoreBidRangeRule(6, 1192),
    ],
  );
}
