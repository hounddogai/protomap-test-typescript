import { WeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

/** A rule a weighted deflection assignment must pass. Check returns its problems, or none. */
export interface WeightedDeflectionAssignmentRule {
  check(item: WeightedDeflectionAssignment): string[];
}

export class WeightedDeflectionAssignmentLabelLengthRule implements WeightedDeflectionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDeflectionAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDeflectionAssignmentCeilingRangeRule implements WeightedDeflectionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedDeflectionAssignment): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedDeflectionAssignmentCodeLengthRule implements WeightedDeflectionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedDeflectionAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedDeflectionAssignmentBudgetRangeRule implements WeightedDeflectionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedDeflectionAssignment): string[] {
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

/** Runs every rule of a weighted deflection assignment. */
export class WeightedDeflectionAssignmentValidator {
  rules: WeightedDeflectionAssignmentRule[];

  constructor(rules: WeightedDeflectionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDeflectionAssignment): string[] {
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

  requireValid(item: WeightedDeflectionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDeflectionAssignment[]): Map<string, string[]> {
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

export function defaultWeightedDeflectionAssignmentValidator(): WeightedDeflectionAssignmentValidator {
  return new WeightedDeflectionAssignmentValidator(
    [
      new WeightedDeflectionAssignmentLabelLengthRule(120),
      new WeightedDeflectionAssignmentCeilingRangeRule(5.4, 2138.8),
      new WeightedDeflectionAssignmentCodeLengthRule(32),
      new WeightedDeflectionAssignmentBudgetRangeRule(7.9, 877),
    ],
  );
}
