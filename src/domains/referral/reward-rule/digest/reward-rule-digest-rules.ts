import { RewardRuleDigest } from "./reward-rule-digest.js";

/** A rule a reward rule digest must pass. Check returns its problems, or none. */
export interface RewardRuleDigestRule {
  check(item: RewardRuleDigest): string[];
}

export class RewardRuleDigestRequiredTitleRule implements RewardRuleDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleDigestExpiresAtRangeRule implements RewardRuleDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleDigest): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleDigestCodeLengthRule implements RewardRuleDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule digest. */
export class RewardRuleDigestValidator {
  rules: RewardRuleDigestRule[];

  constructor(rules: RewardRuleDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleDigest): string[] {
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

  requireValid(item: RewardRuleDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleDigest[]): Map<string, string[]> {
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

export function defaultRewardRuleDigestValidator(): RewardRuleDigestValidator {
  return new RewardRuleDigestValidator(
    [
      new RewardRuleDigestRequiredTitleRule("reward rule digest needs an entry"),
      new RewardRuleDigestExpiresAtRangeRule(80, 120),
      new RewardRuleDigestCodeLengthRule(32),
    ],
  );
}
