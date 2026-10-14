import { RetentionAssignment } from "./retention-assignment.js";

/** A rule a retention assignment must pass. Check returns its problems, or none. */
export interface RetentionAssignmentRule {
  check(item: RetentionAssignment): string[];
}

export class RetentionAssignmentRequiredCodeRule implements RetentionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionAssignmentLabelLengthRule implements RetentionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionAssignmentFloorValueRangeRule implements RetentionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAssignment): string[] {
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

export class RetentionAssignmentCodeLengthRule implements RetentionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionAssignmentMinimumRangeRule implements RetentionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionAssignment): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionAssignmentCodePrefixRule implements RetentionAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a retention assignment. */
export class RetentionAssignmentValidator {
  rules: RetentionAssignmentRule[];

  constructor(rules: RetentionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionAssignment[]): Map<string, string[]> {
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

export function defaultRetentionAssignmentValidator(): RetentionAssignmentValidator {
  return new RetentionAssignmentValidator(
    [
      new RetentionAssignmentRequiredCodeRule("retention assignment needs this field"),
      new RetentionAssignmentLabelLengthRule(3600),
      new RetentionAssignmentFloorValueRangeRule(5.7, 1155.9),
      new RetentionAssignmentCodeLengthRule(3600),
      new RetentionAssignmentMinimumRangeRule(7.2, 2786),
      new RetentionAssignmentCodePrefixRule("ACM"),
    ],
  );
}
