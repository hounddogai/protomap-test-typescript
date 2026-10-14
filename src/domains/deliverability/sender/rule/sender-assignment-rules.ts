import { SenderAssignment } from "./sender-assignment.js";

/** A rule a sender assignment must pass. Check returns its problems, or none. */
export interface SenderAssignmentRule {
  check(item: SenderAssignment): string[];
}

export class SenderAssignmentNameLengthRule implements SenderAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderAssignmentSourceLengthRule implements SenderAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderAssignment): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderAssignmentCountryLengthRule implements SenderAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderAssignment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sender assignment. */
export class SenderAssignmentValidator {
  rules: SenderAssignmentRule[];

  constructor(rules: SenderAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: SenderAssignment): string[] {
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

  requireValid(item: SenderAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderAssignment[]): Map<string, string[]> {
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

export function defaultSenderAssignmentValidator(): SenderAssignmentValidator {
  return new SenderAssignmentValidator(
    [
      new SenderAssignmentNameLengthRule(86400),
      new SenderAssignmentSourceLengthRule(3600),
      new SenderAssignmentCountryLengthRule(80),
    ],
  );
}
