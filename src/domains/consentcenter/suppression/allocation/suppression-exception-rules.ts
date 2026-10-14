import { SuppressionException } from "./suppression-exception.js";

/** A rule a suppression exception must pass. Check returns its problems, or none. */
export interface SuppressionExceptionRule {
  check(item: SuppressionException): string[];
}

export class SuppressionExceptionCreatedAtRangeRule implements SuppressionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionException): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SuppressionExceptionRequiredUnitRule implements SuppressionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionException): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionExceptionRequiredReviewerRule implements SuppressionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionException): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression exception. */
export class SuppressionExceptionValidator {
  rules: SuppressionExceptionRule[];

  constructor(rules: SuppressionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionException[]): Map<string, string[]> {
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

export function defaultSuppressionExceptionValidator(): SuppressionExceptionValidator {
  return new SuppressionExceptionValidator(
    [
      new SuppressionExceptionCreatedAtRangeRule(120, 1000),
      new SuppressionExceptionRequiredUnitRule("suppression exception needs an entry"),
      new SuppressionExceptionRequiredReviewerRule("suppression exception needs this field"),
    ],
  );
}
