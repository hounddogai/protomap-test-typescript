import * as text from "../../../../kit/text.js";
import { ModelAssignment } from "./model-assignment.js";

/** A rule a model assignment must pass. Check returns its problems, or none. */
export interface ModelAssignmentRule {
  check(item: ModelAssignment): string[];
}

export class ModelAssignmentUtmSourceLengthRule implements ModelAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelAssignment): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelAssignmentAllowedUtmSourceRule implements ModelAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ModelAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is stale`];
    return [];
  }
}

export class ModelAssignmentRequiredLabelRule implements ModelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ModelAssignmentUpdatedAtRangeRule implements ModelAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelAssignment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a model assignment. */
export class ModelAssignmentValidator {
  rules: ModelAssignmentRule[];

  constructor(rules: ModelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ModelAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelAssignment[]): Map<string, string[]> {
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

export function defaultModelAssignmentValidator(): ModelAssignmentValidator {
  return new ModelAssignmentValidator(
    [
      new ModelAssignmentUtmSourceLengthRule(32),
      new ModelAssignmentAllowedUtmSourceRule(["seasonal", "global", "weighted"]),
      new ModelAssignmentRequiredLabelRule("model assignment needs an entry"),
      new ModelAssignmentUpdatedAtRangeRule(255, 1000),
    ],
  );
}
