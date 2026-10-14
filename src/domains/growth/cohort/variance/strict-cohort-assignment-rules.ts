import { StrictCohortAssignment } from "./strict-cohort-assignment.js";

/** A rule a strict cohort assignment must pass. Check returns its problems, or none. */
export interface StrictCohortAssignmentRule {
  check(item: StrictCohortAssignment): string[];
}

export class StrictCohortAssignmentContactEmailLengthRule implements StrictCohortAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCohortAssignment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCohortAssignmentCodePrefixRule implements StrictCohortAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictCohortAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictCohortAssignmentRequiredNameRule implements StrictCohortAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCohortAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict cohort assignment. */
export class StrictCohortAssignmentValidator {
  rules: StrictCohortAssignmentRule[];

  constructor(rules: StrictCohortAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCohortAssignment): string[] {
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

  requireValid(item: StrictCohortAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCohortAssignment[]): Map<string, string[]> {
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

export function defaultStrictCohortAssignmentValidator(): StrictCohortAssignmentValidator {
  return new StrictCohortAssignmentValidator(
    [
      new StrictCohortAssignmentContactEmailLengthRule(255),
      new StrictCohortAssignmentCodePrefixRule("Q"),
      new StrictCohortAssignmentRequiredNameRule("strict cohort assignment needs this field"),
    ],
  );
}
