import { PrimaryProofAssignment } from "./primary-proof-assignment.js";

/** A rule a primary proof assignment must pass. Check returns its problems, or none. */
export interface PrimaryProofAssignmentRule {
  check(item: PrimaryProofAssignment): string[];
}

export class PrimaryProofAssignmentRequiredUnitRule implements PrimaryProofAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryProofAssignment): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryProofAssignmentCodePrefixRule implements PrimaryProofAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryProofAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryProofAssignmentRequiredExternalRefRule implements PrimaryProofAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryProofAssignment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryProofAssignmentTitleLengthRule implements PrimaryProofAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryProofAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary proof assignment. */
export class PrimaryProofAssignmentValidator {
  rules: PrimaryProofAssignmentRule[];

  constructor(rules: PrimaryProofAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryProofAssignment): string[] {
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

  requireValid(item: PrimaryProofAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryProofAssignment[]): Map<string, string[]> {
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

export function defaultPrimaryProofAssignmentValidator(): PrimaryProofAssignmentValidator {
  return new PrimaryProofAssignmentValidator(
    [
      new PrimaryProofAssignmentRequiredUnitRule("primary proof assignment needs a value"),
      new PrimaryProofAssignmentCodePrefixRule("Q"),
      new PrimaryProofAssignmentRequiredExternalRefRule("primary proof assignment needs this field"),
      new PrimaryProofAssignmentTitleLengthRule(16),
    ],
  );
}
