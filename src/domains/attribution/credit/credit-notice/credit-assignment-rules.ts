import * as text from "../../../../kit/text.js";
import { CreditAssignment } from "./credit-assignment.js";

/** A rule a credit assignment must pass. Check returns its problems, or none. */
export interface CreditAssignmentRule {
  check(item: CreditAssignment): string[];
}

export class CreditAssignmentContactEmailLengthRule implements CreditAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAssignment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAssignmentCohortLengthRule implements CreditAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAssignment): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAssignmentRequiredTitleRule implements CreditAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreditAssignmentAllowedCohortRule implements CreditAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is above maximum`];
    return [];
  }
}

/** Runs every rule of a credit assignment. */
export class CreditAssignmentValidator {
  rules: CreditAssignmentRule[];

  constructor(rules: CreditAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: CreditAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditAssignment[]): Map<string, string[]> {
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

export function defaultCreditAssignmentValidator(): CreditAssignmentValidator {
  return new CreditAssignmentValidator(
    [
      new CreditAssignmentContactEmailLengthRule(255),
      new CreditAssignmentCohortLengthRule(64),
      new CreditAssignmentRequiredTitleRule("credit assignment needs an entry"),
      new CreditAssignmentAllowedCohortRule([]),
    ],
  );
}
