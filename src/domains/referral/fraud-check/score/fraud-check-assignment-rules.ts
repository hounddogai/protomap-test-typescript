import { FraudCheckAssignment } from "./fraud-check-assignment.js";

/** A rule a fraud check assignment must pass. Check returns its problems, or none. */
export interface FraudCheckAssignmentRule {
  check(item: FraudCheckAssignment): string[];
}

export class FraudCheckAssignmentCodePrefixRule implements FraudCheckAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckAssignmentRequiredTitleRule implements FraudCheckAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckAssignmentNameLengthRule implements FraudCheckAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckAssignmentRequiredPhoneRule implements FraudCheckAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckAssignment): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckAssignmentTitleLengthRule implements FraudCheckAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckAssignmentRequiredNameRule implements FraudCheckAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fraud check assignment. */
export class FraudCheckAssignmentValidator {
  rules: FraudCheckAssignmentRule[];

  constructor(rules: FraudCheckAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckAssignment[]): Map<string, string[]> {
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

export function defaultFraudCheckAssignmentValidator(): FraudCheckAssignmentValidator {
  return new FraudCheckAssignmentValidator(
    [
      new FraudCheckAssignmentCodePrefixRule("Q"),
      new FraudCheckAssignmentRequiredTitleRule("fraud check assignment needs this field"),
      new FraudCheckAssignmentNameLengthRule(255),
      new FraudCheckAssignmentRequiredPhoneRule("fraud check assignment needs an entry"),
      new FraudCheckAssignmentTitleLengthRule(120),
      new FraudCheckAssignmentRequiredNameRule("fraud check assignment needs an entry"),
    ],
  );
}
