import { RewardRuleMetric } from "./reward-rule-metric.js";

/** A rule a reward rule metric must pass. Check returns its problems, or none. */
export interface RewardRuleMetricRule {
  check(item: RewardRuleMetric): string[];
}

export class RewardRuleMetricOwnerIdLengthRule implements RewardRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleMetric): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleMetricReviewerLengthRule implements RewardRuleMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleMetric): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleMetricRequiredOwnerIdRule implements RewardRuleMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleMetric): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule metric. */
export class RewardRuleMetricValidator {
  rules: RewardRuleMetricRule[];

  constructor(rules: RewardRuleMetricRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleMetric[]): Map<string, string[]> {
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

export function defaultRewardRuleMetricValidator(): RewardRuleMetricValidator {
  return new RewardRuleMetricValidator(
    [
      new RewardRuleMetricOwnerIdLengthRule(16),
      new RewardRuleMetricReviewerLengthRule(1000),
      new RewardRuleMetricRequiredOwnerIdRule("reward rule metric needs a value"),
    ],
  );
}
