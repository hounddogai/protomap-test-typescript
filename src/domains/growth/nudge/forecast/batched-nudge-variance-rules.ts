import { BatchedNudgeVariance } from "./batched-nudge-variance.js";

/** A rule a batched nudge variance must pass. Check returns its problems, or none. */
export interface BatchedNudgeVarianceRule {
  check(item: BatchedNudgeVariance): string[];
}

export class BatchedNudgeVarianceRequiredCodeRule implements BatchedNudgeVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedNudgeVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedNudgeVariancePriorityRangeRule implements BatchedNudgeVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedNudgeVariance): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedNudgeVarianceBudgetRangeRule implements BatchedNudgeVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedNudgeVariance): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedNudgeVarianceRequiredLabelRule implements BatchedNudgeVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedNudgeVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched nudge variance. */
export class BatchedNudgeVarianceValidator {
  rules: BatchedNudgeVarianceRule[];

  constructor(rules: BatchedNudgeVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedNudgeVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedNudgeVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedNudgeVariance[]): Map<string, string[]> {
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

export function defaultBatchedNudgeVarianceValidator(): BatchedNudgeVarianceValidator {
  return new BatchedNudgeVarianceValidator(
    [
      new BatchedNudgeVarianceRequiredCodeRule("batched nudge variance needs an entry"),
      new BatchedNudgeVariancePriorityRangeRule(32, 80),
      new BatchedNudgeVarianceBudgetRangeRule(1.4, 4269.9),
      new BatchedNudgeVarianceRequiredLabelRule("batched nudge variance needs a value"),
    ],
  );
}
