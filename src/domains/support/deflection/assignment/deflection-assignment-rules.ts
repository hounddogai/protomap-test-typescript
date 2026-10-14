import { DeflectionAssignment } from "./deflection-assignment.js";

/** A rule a deflection assignment must pass. Check returns its problems, or none. */
export interface DeflectionAssignmentRule {
  check(item: DeflectionAssignment): string[];
}

export class DeflectionAssignmentStartsAtRangeRule implements DeflectionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionAssignment): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionAssignmentCohortLengthRule implements DeflectionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionAssignment): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionAssignmentCodeLengthRule implements DeflectionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionAssignmentFloorValueRangeRule implements DeflectionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionAssignment): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionAssignmentRequiredCodeRule implements DeflectionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionAssignmentRequiredCohortRule implements DeflectionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionAssignment): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection assignment. */
export class DeflectionAssignmentValidator {
  rules: DeflectionAssignmentRule[];

  constructor(rules: DeflectionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionAssignment): string[] {
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

  requireValid(item: DeflectionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionAssignment[]): Map<string, string[]> {
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

export function defaultDeflectionAssignmentValidator(): DeflectionAssignmentValidator {
  return new DeflectionAssignmentValidator(
    [
      new DeflectionAssignmentStartsAtRangeRule(16, 80),
      new DeflectionAssignmentCohortLengthRule(255),
      new DeflectionAssignmentCodeLengthRule(80),
      new DeflectionAssignmentFloorValueRangeRule(7.5, 3575.7),
      new DeflectionAssignmentRequiredCodeRule("deflection assignment needs this field"),
      new DeflectionAssignmentRequiredCohortRule("deflection assignment needs an entry"),
    ],
  );
}
