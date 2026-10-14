import { CsatAssignment } from "./csat-assignment.js";

/** A rule a csat assignment must pass. Check returns its problems, or none. */
export interface CsatAssignmentRule {
  check(item: CsatAssignment): string[];
}

export class CsatAssignmentVisibleGuardRule implements CsatAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatAssignment): string[] {
    if (item.visible && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class CsatAssignmentCodeLengthRule implements CsatAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatAssignmentRateRangeRule implements CsatAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatAssignment): string[] {
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

export class CsatAssignmentCodePrefixRule implements CsatAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a csat assignment. */
export class CsatAssignmentValidator {
  rules: CsatAssignmentRule[];

  constructor(rules: CsatAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: CsatAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatAssignment[]): Map<string, string[]> {
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

export function defaultCsatAssignmentValidator(): CsatAssignmentValidator {
  return new CsatAssignmentValidator(
    [
      new CsatAssignmentVisibleGuardRule(64),
      new CsatAssignmentCodeLengthRule(64),
      new CsatAssignmentRateRangeRule(2.4, 3500.5),
      new CsatAssignmentCodePrefixRule("REF"),
    ],
  );
}
