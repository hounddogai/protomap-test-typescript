import { BatchedInsightPlan } from "./batched-insight-plan.js";

/** A rule a batched insight plan must pass. Check returns its problems, or none. */
export interface BatchedInsightPlanRule {
  check(item: BatchedInsightPlan): string[];
}

export class BatchedInsightPlanRequiredLocaleRule implements BatchedInsightPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInsightPlan): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInsightPlanLimitRangeRule implements BatchedInsightPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInsightPlan): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedInsightPlanCodeLengthRule implements BatchedInsightPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched insight plan. */
export class BatchedInsightPlanValidator {
  rules: BatchedInsightPlanRule[];

  constructor(rules: BatchedInsightPlanRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInsightPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedInsightPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInsightPlan[]): Map<string, string[]> {
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

export function defaultBatchedInsightPlanValidator(): BatchedInsightPlanValidator {
  return new BatchedInsightPlanValidator(
    [
      new BatchedInsightPlanRequiredLocaleRule("batched insight plan needs this field"),
      new BatchedInsightPlanLimitRangeRule(120, 3600),
      new BatchedInsightPlanCodeLengthRule(80),
    ],
  );
}
