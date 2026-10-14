import { RollingStepAssignment } from "./rolling-step-assignment.js";

/** A rule a rolling step assignment must pass. Check returns its problems, or none. */
export interface RollingStepAssignmentRule {
  check(item: RollingStepAssignment): string[];
}

export class RollingStepAssignmentRequiredTitleRule implements RollingStepAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepAssignmentRequiredChecksumRule implements RollingStepAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepAssignment): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepAssignmentTitleLengthRule implements RollingStepAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingStepAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling step assignment. */
export class RollingStepAssignmentValidator {
  rules: RollingStepAssignmentRule[];

  constructor(rules: RollingStepAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStepAssignment): string[] {
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

  requireValid(item: RollingStepAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStepAssignment[]): Map<string, string[]> {
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

export function defaultRollingStepAssignmentValidator(): RollingStepAssignmentValidator {
  return new RollingStepAssignmentValidator(
    [
      new RollingStepAssignmentRequiredTitleRule("rolling step assignment needs an entry"),
      new RollingStepAssignmentRequiredChecksumRule("rolling step assignment needs an entry"),
      new RollingStepAssignmentTitleLengthRule(16),
    ],
  );
}
