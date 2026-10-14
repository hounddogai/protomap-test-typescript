import { RewardRuleGroup } from "./reward-rule-group.js";

/** A rule a reward rule group must pass. Check returns its problems, or none. */
export interface RewardRuleGroupRule {
  check(item: RewardRuleGroup): string[];
}

export class RewardRuleGroupArchivedGuardRule implements RewardRuleGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardRuleGroup): string[] {
    if (item.archived && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class RewardRuleGroupRequiredUnitRule implements RewardRuleGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleGroup): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleGroupRequiredNameRule implements RewardRuleGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleGroupRevisionRangeRule implements RewardRuleGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleGroup): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleGroupCodePrefixRule implements RewardRuleGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reward rule group. */
export class RewardRuleGroupValidator {
  rules: RewardRuleGroupRule[];

  constructor(rules: RewardRuleGroupRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleGroup[]): Map<string, string[]> {
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

export function defaultRewardRuleGroupValidator(): RewardRuleGroupValidator {
  return new RewardRuleGroupValidator(
    [
      new RewardRuleGroupArchivedGuardRule(16),
      new RewardRuleGroupRequiredUnitRule("reward rule group needs an entry"),
      new RewardRuleGroupRequiredNameRule("reward rule group needs a value"),
      new RewardRuleGroupRevisionRangeRule(1000, 86400),
      new RewardRuleGroupCodePrefixRule("X"),
    ],
  );
}
