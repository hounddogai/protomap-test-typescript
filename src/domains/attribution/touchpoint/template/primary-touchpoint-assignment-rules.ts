import { PrimaryTouchpointAssignment } from "./primary-touchpoint-assignment.js";

/** A rule a primary touchpoint assignment must pass. Check returns its problems, or none. */
export interface PrimaryTouchpointAssignmentRule {
  check(item: PrimaryTouchpointAssignment): string[];
}

export class PrimaryTouchpointAssignmentCodeLengthRule implements PrimaryTouchpointAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTouchpointAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTouchpointAssignmentRequiredNameRule implements PrimaryTouchpointAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTouchpointAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTouchpointAssignmentEndsAtRangeRule implements PrimaryTouchpointAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTouchpointAssignment): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryTouchpointAssignmentAmountRangeRule implements PrimaryTouchpointAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTouchpointAssignment): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryTouchpointAssignmentFrequencyCapRangeRule implements PrimaryTouchpointAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTouchpointAssignment): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryTouchpointAssignmentRequiredCodeRule implements PrimaryTouchpointAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTouchpointAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary touchpoint assignment. */
export class PrimaryTouchpointAssignmentValidator {
  rules: PrimaryTouchpointAssignmentRule[];

  constructor(rules: PrimaryTouchpointAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTouchpointAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryTouchpointAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTouchpointAssignment[]): Map<string, string[]> {
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

export function defaultPrimaryTouchpointAssignmentValidator(): PrimaryTouchpointAssignmentValidator {
  return new PrimaryTouchpointAssignmentValidator(
    [
      new PrimaryTouchpointAssignmentCodeLengthRule(255),
      new PrimaryTouchpointAssignmentRequiredNameRule("primary touchpoint assignment needs a value"),
      new PrimaryTouchpointAssignmentEndsAtRangeRule(32, 1000),
      new PrimaryTouchpointAssignmentAmountRangeRule(2.3, 1579.8),
      new PrimaryTouchpointAssignmentFrequencyCapRangeRule(80, 86400),
      new PrimaryTouchpointAssignmentRequiredCodeRule("primary touchpoint assignment needs a value"),
    ],
  );
}
