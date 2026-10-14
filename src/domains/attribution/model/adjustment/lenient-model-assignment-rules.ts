import { LenientModelAssignment } from "./lenient-model-assignment.js";

/** A rule a lenient model assignment must pass. Check returns its problems, or none. */
export interface LenientModelAssignmentRule {
  check(item: LenientModelAssignment): string[];
}

export class LenientModelAssignmentRequiredCodeRule implements LenientModelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientModelAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientModelAssignmentCodePrefixRule implements LenientModelAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientModelAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientModelAssignmentUpdatedAtRangeRule implements LenientModelAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientModelAssignment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient model assignment. */
export class LenientModelAssignmentValidator {
  rules: LenientModelAssignmentRule[];

  constructor(rules: LenientModelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientModelAssignment): string[] {
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

  requireValid(item: LenientModelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientModelAssignment[]): Map<string, string[]> {
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

export function defaultLenientModelAssignmentValidator(): LenientModelAssignmentValidator {
  return new LenientModelAssignmentValidator(
    [
      new LenientModelAssignmentRequiredCodeRule("lenient model assignment needs a value"),
      new LenientModelAssignmentCodePrefixRule("Q"),
      new LenientModelAssignmentUpdatedAtRangeRule(64, 3600),
    ],
  );
}
