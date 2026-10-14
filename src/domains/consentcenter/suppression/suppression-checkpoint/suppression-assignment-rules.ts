import * as text from "../../../../kit/text.js";
import { SuppressionAssignment } from "./suppression-assignment.js";

/** A rule a suppression assignment must pass. Check returns its problems, or none. */
export interface SuppressionAssignmentRule {
  check(item: SuppressionAssignment): string[];
}

export class SuppressionAssignmentReviewerLengthRule implements SuppressionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionAssignment): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionAssignmentUpdatedAtRangeRule implements SuppressionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionAssignment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionAssignmentAllowedCodeRule implements SuppressionAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class SuppressionAssignmentRequiredCodeRule implements SuppressionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionAssignmentClicksRangeRule implements SuppressionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionAssignment): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a suppression assignment. */
export class SuppressionAssignmentValidator {
  rules: SuppressionAssignmentRule[];

  constructor(rules: SuppressionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionAssignment): string[] {
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

  requireValid(item: SuppressionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionAssignment[]): Map<string, string[]> {
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

export function defaultSuppressionAssignmentValidator(): SuppressionAssignmentValidator {
  return new SuppressionAssignmentValidator(
    [
      new SuppressionAssignmentReviewerLengthRule(255),
      new SuppressionAssignmentUpdatedAtRangeRule(64, 3600),
      new SuppressionAssignmentAllowedCodeRule([]),
      new SuppressionAssignmentRequiredCodeRule("suppression assignment needs this field"),
      new SuppressionAssignmentClicksRangeRule(32, 32),
    ],
  );
}
