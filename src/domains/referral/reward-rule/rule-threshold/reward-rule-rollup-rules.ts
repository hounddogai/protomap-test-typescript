import { RewardRuleRollup } from "./reward-rule-rollup.js";

/** A rule a reward rule rollup must pass. Check returns its problems, or none. */
export interface RewardRuleRollupRule {
  check(item: RewardRuleRollup): string[];
}

export class RewardRuleRollupTitleLengthRule implements RewardRuleRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleRollupAmountRangeRule implements RewardRuleRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleRollup): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleRollupAudienceIdLengthRule implements RewardRuleRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleRollup): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleRollupRequiredTitleRule implements RewardRuleRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule rollup. */
export class RewardRuleRollupValidator {
  rules: RewardRuleRollupRule[];

  constructor(rules: RewardRuleRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleRollup): string[] {
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

  requireValid(item: RewardRuleRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleRollup[]): Map<string, string[]> {
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

export function defaultRewardRuleRollupValidator(): RewardRuleRollupValidator {
  return new RewardRuleRollupValidator(
    [
      new RewardRuleRollupTitleLengthRule(64),
      new RewardRuleRollupAmountRangeRule(3.3, 4445.6),
      new RewardRuleRollupAudienceIdLengthRule(255),
      new RewardRuleRollupRequiredTitleRule("reward rule rollup needs an entry"),
    ],
  );
}
