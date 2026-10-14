import { PendingRewardRuleEstimate } from "./pending-reward-rule-estimate.js";

/** A rule a pending reward rule estimate must pass. Check returns its problems, or none. */
export interface PendingRewardRuleEstimateRule {
  check(item: PendingRewardRuleEstimate): string[];
}

export class PendingRewardRuleEstimateRequiredPhoneRule implements PendingRewardRuleEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRuleEstimate): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRuleEstimatePhoneLengthRule implements PendingRewardRuleEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRuleEstimate): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardRuleEstimateUpdatedAtRangeRule implements PendingRewardRuleEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRuleEstimate): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRewardRuleEstimateRequiredNameRule implements PendingRewardRuleEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRuleEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending reward rule estimate. */
export class PendingRewardRuleEstimateValidator {
  rules: PendingRewardRuleEstimateRule[];

  constructor(rules: PendingRewardRuleEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardRuleEstimate): string[] {
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

  requireValid(item: PendingRewardRuleEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardRuleEstimate[]): Map<string, string[]> {
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

export function defaultPendingRewardRuleEstimateValidator(): PendingRewardRuleEstimateValidator {
  return new PendingRewardRuleEstimateValidator(
    [
      new PendingRewardRuleEstimateRequiredPhoneRule("pending reward rule estimate needs an entry"),
      new PendingRewardRuleEstimatePhoneLengthRule(1000),
      new PendingRewardRuleEstimateUpdatedAtRangeRule(255, 3600),
      new PendingRewardRuleEstimateRequiredNameRule("pending reward rule estimate needs an entry"),
    ],
  );
}
