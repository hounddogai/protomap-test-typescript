import { RewardRuleVariance } from "./reward-rule-variance.js";

/** A rule a reward rule variance must pass. Check returns its problems, or none. */
export interface RewardRuleVarianceRule {
  check(item: RewardRuleVariance): string[];
}

export class RewardRuleVarianceRequiredTitleRule implements RewardRuleVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleVarianceCodePrefixRule implements RewardRuleVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleVarianceRequiredCodeRule implements RewardRuleVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule variance. */
export class RewardRuleVarianceValidator {
  rules: RewardRuleVarianceRule[];

  constructor(rules: RewardRuleVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleVariance): string[] {
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

  requireValid(item: RewardRuleVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleVariance[]): Map<string, string[]> {
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

export function defaultRewardRuleVarianceValidator(): RewardRuleVarianceValidator {
  return new RewardRuleVarianceValidator(
    [
      new RewardRuleVarianceRequiredTitleRule("reward rule variance needs this field"),
      new RewardRuleVarianceCodePrefixRule("Q"),
      new RewardRuleVarianceRequiredCodeRule("reward rule variance needs an entry"),
    ],
  );
}
