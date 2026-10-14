import { DefaultRewardRuleBatch } from "./default-reward-rule-batch.js";

/** A rule a default reward rule batch must pass. Check returns its problems, or none. */
export interface DefaultRewardRuleBatchRule {
  check(item: DefaultRewardRuleBatch): string[];
}

export class DefaultRewardRuleBatchMinimumRangeRule implements DefaultRewardRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRewardRuleBatch): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultRewardRuleBatchAttemptsRangeRule implements DefaultRewardRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRewardRuleBatch): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultRewardRuleBatchCurrencyLengthRule implements DefaultRewardRuleBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultRewardRuleBatch): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default reward rule batch. */
export class DefaultRewardRuleBatchValidator {
  rules: DefaultRewardRuleBatchRule[];

  constructor(rules: DefaultRewardRuleBatchRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRewardRuleBatch): string[] {
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

  requireValid(item: DefaultRewardRuleBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRewardRuleBatch[]): Map<string, string[]> {
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

export function defaultDefaultRewardRuleBatchValidator(): DefaultRewardRuleBatchValidator {
  return new DefaultRewardRuleBatchValidator(
    [
      new DefaultRewardRuleBatchMinimumRangeRule(3.2, 4755.8),
      new DefaultRewardRuleBatchAttemptsRangeRule(32, 64),
      new DefaultRewardRuleBatchCurrencyLengthRule(64),
    ],
  );
}
