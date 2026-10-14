import { RewardRuleSummary } from "./reward-rule-summary.js";

/** A rule a reward rule summary must pass. Check returns its problems, or none. */
export interface RewardRuleSummaryRule {
  check(item: RewardRuleSummary): string[];
}

export class RewardRuleSummaryPinnedGuardRule implements RewardRuleSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardRuleSummary): string[] {
    if (item.pinned && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RewardRuleSummaryRequiredTitleRule implements RewardRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleSummaryRequiredCodeRule implements RewardRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule summary. */
export class RewardRuleSummaryValidator {
  rules: RewardRuleSummaryRule[];

  constructor(rules: RewardRuleSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleSummary[]): Map<string, string[]> {
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

export function defaultRewardRuleSummaryValidator(): RewardRuleSummaryValidator {
  return new RewardRuleSummaryValidator(
    [
      new RewardRuleSummaryPinnedGuardRule(86400),
      new RewardRuleSummaryRequiredTitleRule("reward rule summary needs this field"),
      new RewardRuleSummaryRequiredCodeRule("reward rule summary needs an entry"),
    ],
  );
}
