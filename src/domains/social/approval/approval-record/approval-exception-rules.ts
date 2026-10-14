import { ApprovalException } from "./approval-exception.js";

/** A rule a approval exception must pass. Check returns its problems, or none. */
export interface ApprovalExceptionRule {
  check(item: ApprovalException): string[];
}

export class ApprovalExceptionThresholdRangeRule implements ApprovalExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalException): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalExceptionRequiredCohortRule implements ApprovalExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalException): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalExceptionRequiredLabelRule implements ApprovalExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval exception. */
export class ApprovalExceptionValidator {
  rules: ApprovalExceptionRule[];

  constructor(rules: ApprovalExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalException[]): Map<string, string[]> {
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

export function defaultApprovalExceptionValidator(): ApprovalExceptionValidator {
  return new ApprovalExceptionValidator(
    [
      new ApprovalExceptionThresholdRangeRule(6.4, 1251.9),
      new ApprovalExceptionRequiredCohortRule("approval exception needs a value"),
      new ApprovalExceptionRequiredLabelRule("approval exception needs this field"),
    ],
  );
}
