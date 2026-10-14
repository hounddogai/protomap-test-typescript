import { RewardRuleMilestone } from "./reward-rule-milestone.js";

/** A rule a reward rule milestone must pass. Check returns its problems, or none. */
export interface RewardRuleMilestoneRule {
  check(item: RewardRuleMilestone): string[];
}

export class RewardRuleMilestoneRequiredCurrencyRule implements RewardRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleMilestone): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleMilestoneTitleLengthRule implements RewardRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleMilestone): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleMilestoneCurrencyLengthRule implements RewardRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleMilestone): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleMilestoneRequiredCodeRule implements RewardRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleMilestoneMinimumRangeRule implements RewardRuleMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleMilestone): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward rule milestone. */
export class RewardRuleMilestoneValidator {
  rules: RewardRuleMilestoneRule[];

  constructor(rules: RewardRuleMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleMilestone): string[] {
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

  requireValid(item: RewardRuleMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleMilestone[]): Map<string, string[]> {
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

export function defaultRewardRuleMilestoneValidator(): RewardRuleMilestoneValidator {
  return new RewardRuleMilestoneValidator(
    [
      new RewardRuleMilestoneRequiredCurrencyRule("reward rule milestone needs a value"),
      new RewardRuleMilestoneTitleLengthRule(16),
      new RewardRuleMilestoneCurrencyLengthRule(1000),
      new RewardRuleMilestoneRequiredCodeRule("reward rule milestone needs a value"),
      new RewardRuleMilestoneMinimumRangeRule(5.5, 496.5),
    ],
  );
}
