import { DoubleOptInAssignment } from "./double-opt-in-assignment.js";

/** A rule a double opt in assignment must pass. Check returns its problems, or none. */
export interface DoubleOptInAssignmentRule {
  check(item: DoubleOptInAssignment): string[];
}

export class DoubleOptInAssignmentCodePrefixRule implements DoubleOptInAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInAssignmentRequiredSegmentRule implements DoubleOptInAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInAssignment): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInAssignmentMaximumRangeRule implements DoubleOptInAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInAssignment): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a double opt in assignment. */
export class DoubleOptInAssignmentValidator {
  rules: DoubleOptInAssignmentRule[];

  constructor(rules: DoubleOptInAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInAssignment): string[] {
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

  requireValid(item: DoubleOptInAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInAssignment[]): Map<string, string[]> {
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

export function defaultDoubleOptInAssignmentValidator(): DoubleOptInAssignmentValidator {
  return new DoubleOptInAssignmentValidator(
    [
      new DoubleOptInAssignmentCodePrefixRule("OPS"),
      new DoubleOptInAssignmentRequiredSegmentRule("double opt in assignment needs a value"),
      new DoubleOptInAssignmentMaximumRangeRule(5.9, 1536.5),
    ],
  );
}
