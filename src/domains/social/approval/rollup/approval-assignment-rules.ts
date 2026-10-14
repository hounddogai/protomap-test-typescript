import { ApprovalAssignment } from "./approval-assignment.js";

/** A rule a approval assignment must pass. Check returns its problems, or none. */
export interface ApprovalAssignmentRule {
  check(item: ApprovalAssignment): string[];
}

export class ApprovalAssignmentLocaleLengthRule implements ApprovalAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAssignment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAssignmentRequiredCodeRule implements ApprovalAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalAssignmentTitleLengthRule implements ApprovalAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAssignmentRequiredTitleRule implements ApprovalAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval assignment. */
export class ApprovalAssignmentValidator {
  rules: ApprovalAssignmentRule[];

  constructor(rules: ApprovalAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalAssignment[]): Map<string, string[]> {
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

export function defaultApprovalAssignmentValidator(): ApprovalAssignmentValidator {
  return new ApprovalAssignmentValidator(
    [
      new ApprovalAssignmentLocaleLengthRule(64),
      new ApprovalAssignmentRequiredCodeRule("approval assignment needs a value"),
      new ApprovalAssignmentTitleLengthRule(64),
      new ApprovalAssignmentRequiredTitleRule("approval assignment needs this field"),
    ],
  );
}
