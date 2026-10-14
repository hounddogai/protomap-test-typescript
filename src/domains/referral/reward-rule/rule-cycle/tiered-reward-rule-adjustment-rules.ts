import { TieredRewardRuleAdjustment } from "./tiered-reward-rule-adjustment.js";

/** A rule a tiered reward rule adjustment must pass. Check returns its problems, or none. */
export interface TieredRewardRuleAdjustmentRule {
  check(item: TieredRewardRuleAdjustment): string[];
}

export class TieredRewardRuleAdjustmentRequiredCodeRule implements TieredRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleAdjustmentCodeLengthRule implements TieredRewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardRuleAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardRuleAdjustmentRetriesRangeRule implements TieredRewardRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleAdjustment): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredRewardRuleAdjustmentTitleLengthRule implements TieredRewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardRuleAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered reward rule adjustment. */
export class TieredRewardRuleAdjustmentValidator {
  rules: TieredRewardRuleAdjustmentRule[];

  constructor(rules: TieredRewardRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardRuleAdjustment): string[] {
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

  requireValid(item: TieredRewardRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardRuleAdjustment[]): Map<string, string[]> {
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

export function defaultTieredRewardRuleAdjustmentValidator(): TieredRewardRuleAdjustmentValidator {
  return new TieredRewardRuleAdjustmentValidator(
    [
      new TieredRewardRuleAdjustmentRequiredCodeRule("tiered reward rule adjustment needs a value"),
      new TieredRewardRuleAdjustmentCodeLengthRule(3600),
      new TieredRewardRuleAdjustmentRetriesRangeRule(120, 1000),
      new TieredRewardRuleAdjustmentTitleLengthRule(80),
    ],
  );
}
