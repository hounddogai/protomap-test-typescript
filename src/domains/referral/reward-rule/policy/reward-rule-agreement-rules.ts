import { RewardRuleAgreement } from "./reward-rule-agreement.js";

/** A rule a reward rule agreement must pass. Check returns its problems, or none. */
export interface RewardRuleAgreementRule {
  check(item: RewardRuleAgreement): string[];
}

export class RewardRuleAgreementUpdatedAtRangeRule implements RewardRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleAgreement): string[] {
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

export class RewardRuleAgreementCodePrefixRule implements RewardRuleAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleAgreementRequiredSourceRule implements RewardRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleAgreement): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleAgreementCapacityRangeRule implements RewardRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleAgreement): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleAgreementTagsLimitRule implements RewardRuleAgreementRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RewardRuleAgreement): string[] {
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

export class RewardRuleAgreementRequiredNameRule implements RewardRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule agreement. */
export class RewardRuleAgreementValidator {
  rules: RewardRuleAgreementRule[];

  constructor(rules: RewardRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleAgreement[]): Map<string, string[]> {
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

export function defaultRewardRuleAgreementValidator(): RewardRuleAgreementValidator {
  return new RewardRuleAgreementValidator(
    [
      new RewardRuleAgreementUpdatedAtRangeRule(16, 1000),
      new RewardRuleAgreementCodePrefixRule("Q"),
      new RewardRuleAgreementRequiredSourceRule("reward rule agreement needs an entry"),
      new RewardRuleAgreementCapacityRangeRule(120, 3600),
      new RewardRuleAgreementTagsLimitRule(86400, []),
      new RewardRuleAgreementRequiredNameRule("reward rule agreement needs a value"),
    ],
  );
}
