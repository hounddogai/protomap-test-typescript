import { MentionAssignment } from "./mention-assignment.js";

/** A rule a mention assignment must pass. Check returns its problems, or none. */
export interface MentionAssignmentRule {
  check(item: MentionAssignment): string[];
}

export class MentionAssignmentRequiredRegionRule implements MentionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionAssignment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class MentionAssignmentRegionLengthRule implements MentionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAssignment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionAssignmentReviewerLengthRule implements MentionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionAssignment): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention assignment. */
export class MentionAssignmentValidator {
  rules: MentionAssignmentRule[];

  constructor(rules: MentionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: MentionAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionAssignment[]): Map<string, string[]> {
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

export function defaultMentionAssignmentValidator(): MentionAssignmentValidator {
  return new MentionAssignmentValidator(
    [
      new MentionAssignmentRequiredRegionRule("mention assignment needs this field"),
      new MentionAssignmentRegionLengthRule(120),
      new MentionAssignmentReviewerLengthRule(3600),
    ],
  );
}
