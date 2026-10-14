import { RollingLevelAssignment } from "./rolling-level-assignment.js";

/** A rule a rolling level assignment must pass. Check returns its problems, or none. */
export interface RollingLevelAssignmentRule {
  check(item: RollingLevelAssignment): string[];
}

export class RollingLevelAssignmentRequiredExternalRefRule implements RollingLevelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLevelAssignment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLevelAssignmentExternalRefLengthRule implements RollingLevelAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLevelAssignment): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLevelAssignmentCodePrefixRule implements RollingLevelAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingLevelAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling level assignment. */
export class RollingLevelAssignmentValidator {
  rules: RollingLevelAssignmentRule[];

  constructor(rules: RollingLevelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLevelAssignment): string[] {
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

  requireValid(item: RollingLevelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLevelAssignment[]): Map<string, string[]> {
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

export function defaultRollingLevelAssignmentValidator(): RollingLevelAssignmentValidator {
  return new RollingLevelAssignmentValidator(
    [
      new RollingLevelAssignmentRequiredExternalRefRule("rolling level assignment needs this field"),
      new RollingLevelAssignmentExternalRefLengthRule(64),
      new RollingLevelAssignmentCodePrefixRule("REF"),
    ],
  );
}
