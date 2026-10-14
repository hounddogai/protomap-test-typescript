import { BatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

/** A rule a batched reward rule policy must pass. Check returns its problems, or none. */
export interface BatchedRewardRulePolicyRule {
  check(item: BatchedRewardRulePolicy): string[];
}

export class BatchedRewardRulePolicyTitleLengthRule implements BatchedRewardRulePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedRewardRulePolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedRewardRulePolicyFloorValueRangeRule implements BatchedRewardRulePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRewardRulePolicy): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedRewardRulePolicyRequiredTitleRule implements BatchedRewardRulePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRewardRulePolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched reward rule policy. */
export class BatchedRewardRulePolicyValidator {
  rules: BatchedRewardRulePolicyRule[];

  constructor(rules: BatchedRewardRulePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRewardRulePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedRewardRulePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRewardRulePolicy[]): Map<string, string[]> {
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

export function defaultBatchedRewardRulePolicyValidator(): BatchedRewardRulePolicyValidator {
  return new BatchedRewardRulePolicyValidator(
    [
      new BatchedRewardRulePolicyTitleLengthRule(86400),
      new BatchedRewardRulePolicyFloorValueRangeRule(9.3, 2836.8),
      new BatchedRewardRulePolicyRequiredTitleRule("batched reward rule policy needs an entry"),
    ],
  );
}
