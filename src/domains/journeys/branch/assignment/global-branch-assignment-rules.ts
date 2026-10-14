import { GlobalBranchAssignment } from "./global-branch-assignment.js";

/** A rule a global branch assignment must pass. Check returns its problems, or none. */
export interface GlobalBranchAssignmentRule {
  check(item: GlobalBranchAssignment): string[];
}

export class GlobalBranchAssignmentNameLengthRule implements GlobalBranchAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBranchAssignmentCodeLengthRule implements GlobalBranchAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBranchAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBranchAssignmentImpressionsRangeRule implements GlobalBranchAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBranchAssignment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global branch assignment. */
export class GlobalBranchAssignmentValidator {
  rules: GlobalBranchAssignmentRule[];

  constructor(rules: GlobalBranchAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBranchAssignment): string[] {
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

  requireValid(item: GlobalBranchAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBranchAssignment[]): Map<string, string[]> {
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

export function defaultGlobalBranchAssignmentValidator(): GlobalBranchAssignmentValidator {
  return new GlobalBranchAssignmentValidator(
    [
      new GlobalBranchAssignmentNameLengthRule(255),
      new GlobalBranchAssignmentCodeLengthRule(32),
      new GlobalBranchAssignmentImpressionsRangeRule(16, 86400),
    ],
  );
}
