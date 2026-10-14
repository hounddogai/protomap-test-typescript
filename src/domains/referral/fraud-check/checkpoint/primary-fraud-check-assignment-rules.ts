import * as text from "../../../../kit/text.js";
import { PrimaryFraudCheckAssignment } from "./primary-fraud-check-assignment.js";

/** A rule a primary fraud check assignment must pass. Check returns its problems, or none. */
export interface PrimaryFraudCheckAssignmentRule {
  check(item: PrimaryFraudCheckAssignment): string[];
}

export class PrimaryFraudCheckAssignmentDescriptionLengthRule implements PrimaryFraudCheckAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckAssignment): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFraudCheckAssignmentTitleLengthRule implements PrimaryFraudCheckAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFraudCheckAssignmentCodePrefixRule implements PrimaryFraudCheckAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryFraudCheckAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryFraudCheckAssignmentRequiredDescriptionRule implements PrimaryFraudCheckAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFraudCheckAssignment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFraudCheckAssignmentAllowedDescriptionRule implements PrimaryFraudCheckAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryFraudCheckAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is out of range`];
    return [];
  }
}

export class PrimaryFraudCheckAssignmentCodeLengthRule implements PrimaryFraudCheckAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary fraud check assignment. */
export class PrimaryFraudCheckAssignmentValidator {
  rules: PrimaryFraudCheckAssignmentRule[];

  constructor(rules: PrimaryFraudCheckAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFraudCheckAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFraudCheckAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFraudCheckAssignment[]): Map<string, string[]> {
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

export function defaultPrimaryFraudCheckAssignmentValidator(): PrimaryFraudCheckAssignmentValidator {
  return new PrimaryFraudCheckAssignmentValidator(
    [
      new PrimaryFraudCheckAssignmentDescriptionLengthRule(255),
      new PrimaryFraudCheckAssignmentTitleLengthRule(80),
      new PrimaryFraudCheckAssignmentCodePrefixRule("X"),
      new PrimaryFraudCheckAssignmentRequiredDescriptionRule("primary fraud check assignment needs a value"),
      new PrimaryFraudCheckAssignmentAllowedDescriptionRule(["weighted"]),
      new PrimaryFraudCheckAssignmentCodeLengthRule(255),
    ],
  );
}
