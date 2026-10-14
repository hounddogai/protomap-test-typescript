import { RewardRuleRecord } from "./reward-rule-record.js";

/** A rule a reward rule record must pass. Check returns its problems, or none. */
export interface RewardRuleRecordRule {
  check(item: RewardRuleRecord): string[];
}

export class RewardRuleRecordTitleLengthRule implements RewardRuleRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleRecordQuantityRangeRule implements RewardRuleRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleRecord): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleRecordRequiredNameRule implements RewardRuleRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleRecordRequiredTitleRule implements RewardRuleRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule record. */
export class RewardRuleRecordValidator {
  rules: RewardRuleRecordRule[];

  constructor(rules: RewardRuleRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleRecord): string[] {
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

  requireValid(item: RewardRuleRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleRecord[]): Map<string, string[]> {
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

export function defaultRewardRuleRecordValidator(): RewardRuleRecordValidator {
  return new RewardRuleRecordValidator(
    [
      new RewardRuleRecordTitleLengthRule(86400),
      new RewardRuleRecordQuantityRangeRule(16, 86400),
      new RewardRuleRecordRequiredNameRule("reward rule record needs this field"),
      new RewardRuleRecordRequiredTitleRule("reward rule record needs a value"),
    ],
  );
}
