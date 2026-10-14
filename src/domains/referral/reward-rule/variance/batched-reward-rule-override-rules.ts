import { BatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

/** A rule a batched reward rule override must pass. Check returns its problems, or none. */
export interface BatchedRewardRuleOverrideRule {
  check(item: BatchedRewardRuleOverride): string[];
}

export class BatchedRewardRuleOverrideVisibleGuardRule implements BatchedRewardRuleOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedRewardRuleOverride): string[] {
    if (item.visible && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BatchedRewardRuleOverrideSummaryLengthRule implements BatchedRewardRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRewardRuleOverride): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRewardRuleOverrideNameLengthRule implements BatchedRewardRuleOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRewardRuleOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched reward rule override. */
export class BatchedRewardRuleOverrideValidator {
  rules: BatchedRewardRuleOverrideRule[];

  constructor(rules: BatchedRewardRuleOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRewardRuleOverride): string[] {
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

  requireValid(item: BatchedRewardRuleOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRewardRuleOverride[]): Map<string, string[]> {
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

export function defaultBatchedRewardRuleOverrideValidator(): BatchedRewardRuleOverrideValidator {
  return new BatchedRewardRuleOverrideValidator(
    [
      new BatchedRewardRuleOverrideVisibleGuardRule(2.6),
      new BatchedRewardRuleOverrideSummaryLengthRule(32),
      new BatchedRewardRuleOverrideNameLengthRule(120),
    ],
  );
}
