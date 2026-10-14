import { WeightedProofAssignment } from "./weighted-proof-assignment.js";

/** A rule a weighted proof assignment must pass. Check returns its problems, or none. */
export interface WeightedProofAssignmentRule {
  check(item: WeightedProofAssignment): string[];
}

export class WeightedProofAssignmentExternalRefLengthRule implements WeightedProofAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedProofAssignment): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedProofAssignmentRequiredExternalRefRule implements WeightedProofAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedProofAssignment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedProofAssignmentBudgetRangeRule implements WeightedProofAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedProofAssignment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted proof assignment. */
export class WeightedProofAssignmentValidator {
  rules: WeightedProofAssignmentRule[];

  constructor(rules: WeightedProofAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedProofAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedProofAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedProofAssignment[]): Map<string, string[]> {
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

export function defaultWeightedProofAssignmentValidator(): WeightedProofAssignmentValidator {
  return new WeightedProofAssignmentValidator(
    [
      new WeightedProofAssignmentExternalRefLengthRule(120),
      new WeightedProofAssignmentRequiredExternalRefRule("weighted proof assignment needs this field"),
      new WeightedProofAssignmentBudgetRangeRule(1.1, 876.7),
    ],
  );
}
