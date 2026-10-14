import { RewardRulePreference } from "./reward-rule-preference.js";

/** A rule a reward rule preference must pass. Check returns its problems, or none. */
export interface RewardRulePreferenceRule {
  check(item: RewardRulePreference): string[];
}

export class RewardRulePreferenceNameLengthRule implements RewardRulePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRulePreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRulePreferenceStartsAtRangeRule implements RewardRulePreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRulePreference): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRulePreferenceTagsLimitRule implements RewardRulePreferenceRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RewardRulePreference): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a reward rule preference. */
export class RewardRulePreferenceValidator {
  rules: RewardRulePreferenceRule[];

  constructor(rules: RewardRulePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRulePreference): string[] {
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

  requireValid(item: RewardRulePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRulePreference[]): Map<string, string[]> {
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

export function defaultRewardRulePreferenceValidator(): RewardRulePreferenceValidator {
  return new RewardRulePreferenceValidator(
    [
      new RewardRulePreferenceNameLengthRule(255),
      new RewardRulePreferenceStartsAtRangeRule(80, 86400),
      new RewardRulePreferenceTagsLimitRule(120, []),
    ],
  );
}
