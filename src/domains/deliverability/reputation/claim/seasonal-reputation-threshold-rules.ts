import { SeasonalReputationThreshold } from "./seasonal-reputation-threshold.js";

/** A rule a seasonal reputation threshold must pass. Check returns its problems, or none. */
export interface SeasonalReputationThresholdRule {
  check(item: SeasonalReputationThreshold): string[];
}

export class SeasonalReputationThresholdCodeLengthRule implements SeasonalReputationThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReputationThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReputationThresholdGraceDaysRangeRule implements SeasonalReputationThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalReputationThreshold): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalReputationThresholdRequiredCodeRule implements SeasonalReputationThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReputationThresholdBudgetRangeRule implements SeasonalReputationThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalReputationThreshold): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalReputationThresholdRequiredTitleRule implements SeasonalReputationThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReputationThresholdRequiredLabelRule implements SeasonalReputationThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal reputation threshold. */
export class SeasonalReputationThresholdValidator {
  rules: SeasonalReputationThresholdRule[];

  constructor(rules: SeasonalReputationThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalReputationThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalReputationThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalReputationThreshold[]): Map<string, string[]> {
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

export function defaultSeasonalReputationThresholdValidator(): SeasonalReputationThresholdValidator {
  return new SeasonalReputationThresholdValidator(
    [
      new SeasonalReputationThresholdCodeLengthRule(80),
      new SeasonalReputationThresholdGraceDaysRangeRule(64, 64),
      new SeasonalReputationThresholdRequiredCodeRule("seasonal reputation threshold needs this field"),
      new SeasonalReputationThresholdBudgetRangeRule(1.5, 1134.3),
      new SeasonalReputationThresholdRequiredTitleRule("seasonal reputation threshold needs a value"),
      new SeasonalReputationThresholdRequiredLabelRule("seasonal reputation threshold needs a value"),
    ],
  );
}
