import { BatchedRewardRule } from "./batched-reward-rule.js";

/** A rule a batched reward rule must pass. Check returns its problems, or none. */
export interface BatchedRewardRuleRule {
  check(item: BatchedRewardRule): string[];
}

export class BatchedRewardRuleRequiredCodeRule implements BatchedRewardRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRewardRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedRewardRuleSendAtRangeRule implements BatchedRewardRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedRewardRule): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedRewardRuleRequiredUtmSourceRule implements BatchedRewardRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedRewardRule): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedRewardRuleCodePrefixRule implements BatchedRewardRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedRewardRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched reward rule. */
export class BatchedRewardRuleValidator {
  rules: BatchedRewardRuleRule[];

  constructor(rules: BatchedRewardRuleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedRewardRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedRewardRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedRewardRule[]): Map<string, string[]> {
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

export function defaultBatchedRewardRuleValidator(): BatchedRewardRuleValidator {
  return new BatchedRewardRuleValidator(
    [
      new BatchedRewardRuleRequiredCodeRule("batched reward rule needs this field"),
      new BatchedRewardRuleSendAtRangeRule(80, 120),
      new BatchedRewardRuleRequiredUtmSourceRule("batched reward rule needs a value"),
      new BatchedRewardRuleCodePrefixRule("REF"),
    ],
  );
}
