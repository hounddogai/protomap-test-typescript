import { PendingOptOutAssignment } from "./pending-opt-out-assignment.js";

/** A rule a pending opt out assignment must pass. Check returns its problems, or none. */
export interface PendingOptOutAssignmentRule {
  check(item: PendingOptOutAssignment): string[];
}

export class PendingOptOutAssignmentRequiredCampaignRefRule implements PendingOptOutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingOptOutAssignment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class PendingOptOutAssignmentCohortLengthRule implements PendingOptOutAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingOptOutAssignment): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingOptOutAssignmentTitleLengthRule implements PendingOptOutAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingOptOutAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending opt out assignment. */
export class PendingOptOutAssignmentValidator {
  rules: PendingOptOutAssignmentRule[];

  constructor(rules: PendingOptOutAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingOptOutAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingOptOutAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingOptOutAssignment[]): Map<string, string[]> {
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

export function defaultPendingOptOutAssignmentValidator(): PendingOptOutAssignmentValidator {
  return new PendingOptOutAssignmentValidator(
    [
      new PendingOptOutAssignmentRequiredCampaignRefRule("pending opt out assignment needs an entry"),
      new PendingOptOutAssignmentCohortLengthRule(64),
      new PendingOptOutAssignmentTitleLengthRule(1000),
    ],
  );
}
