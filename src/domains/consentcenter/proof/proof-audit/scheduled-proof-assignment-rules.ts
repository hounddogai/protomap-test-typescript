import { ScheduledProofAssignment } from "./scheduled-proof-assignment.js";

/** A rule a scheduled proof assignment must pass. Check returns its problems, or none. */
export interface ScheduledProofAssignmentRule {
  check(item: ScheduledProofAssignment): string[];
}

export class ScheduledProofAssignmentCodePrefixRule implements ScheduledProofAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledProofAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledProofAssignmentRateRangeRule implements ScheduledProofAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledProofAssignment): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledProofAssignmentSourceLengthRule implements ScheduledProofAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledProofAssignment): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledProofAssignmentCeilingRangeRule implements ScheduledProofAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledProofAssignment): string[] {
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

/** Runs every rule of a scheduled proof assignment. */
export class ScheduledProofAssignmentValidator {
  rules: ScheduledProofAssignmentRule[];

  constructor(rules: ScheduledProofAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledProofAssignment): string[] {
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

  requireValid(item: ScheduledProofAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledProofAssignment[]): Map<string, string[]> {
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

export function defaultScheduledProofAssignmentValidator(): ScheduledProofAssignmentValidator {
  return new ScheduledProofAssignmentValidator(
    [
      new ScheduledProofAssignmentCodePrefixRule("ACM"),
      new ScheduledProofAssignmentRateRangeRule(6.4, 4986),
      new ScheduledProofAssignmentSourceLengthRule(80),
      new ScheduledProofAssignmentCeilingRangeRule(1.9, 1881.7),
    ],
  );
}
