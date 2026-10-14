import { RewardRuleTier } from "./reward-rule-tier.js";

/** A rule a reward rule tier must pass. Check returns its problems, or none. */
export interface RewardRuleTierRule {
  check(item: RewardRuleTier): string[];
}

export class RewardRuleTierCodeLengthRule implements RewardRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleTierUpdatedAtRangeRule implements RewardRuleTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleTier): string[] {
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

export class RewardRuleTierMaximumRangeRule implements RewardRuleTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleTier): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleTierCodePrefixRule implements RewardRuleTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reward rule tier. */
export class RewardRuleTierValidator {
  rules: RewardRuleTierRule[];

  constructor(rules: RewardRuleTierRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleTier): string[] {
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

  requireValid(item: RewardRuleTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleTier[]): Map<string, string[]> {
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

export function defaultRewardRuleTierValidator(): RewardRuleTierValidator {
  return new RewardRuleTierValidator(
    [
      new RewardRuleTierCodeLengthRule(86400),
      new RewardRuleTierUpdatedAtRangeRule(120, 1000),
      new RewardRuleTierMaximumRangeRule(7.4, 4135.6),
      new RewardRuleTierCodePrefixRule("Q"),
    ],
  );
}
