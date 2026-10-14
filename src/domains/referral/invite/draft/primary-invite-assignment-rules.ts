import * as text from "../../../../kit/text.js";
import { PrimaryInviteAssignment } from "./primary-invite-assignment.js";

/** A rule a primary invite assignment must pass. Check returns its problems, or none. */
export interface PrimaryInviteAssignmentRule {
  check(item: PrimaryInviteAssignment): string[];
}

export class PrimaryInviteAssignmentVariantLengthRule implements PrimaryInviteAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInviteAssignment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInviteAssignmentAllowedCodeRule implements PrimaryInviteAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryInviteAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class PrimaryInviteAssignmentCodeLengthRule implements PrimaryInviteAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInviteAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary invite assignment. */
export class PrimaryInviteAssignmentValidator {
  rules: PrimaryInviteAssignmentRule[];

  constructor(rules: PrimaryInviteAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInviteAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryInviteAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInviteAssignment[]): Map<string, string[]> {
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

export function defaultPrimaryInviteAssignmentValidator(): PrimaryInviteAssignmentValidator {
  return new PrimaryInviteAssignmentValidator(
    [
      new PrimaryInviteAssignmentVariantLengthRule(120),
      new PrimaryInviteAssignmentAllowedCodeRule(["manual", "tiered"]),
      new PrimaryInviteAssignmentCodeLengthRule(80),
    ],
  );
}
