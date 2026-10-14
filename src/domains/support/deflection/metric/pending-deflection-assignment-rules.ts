import { PendingDeflectionAssignment } from "./pending-deflection-assignment.js";

/** A rule a pending deflection assignment must pass. Check returns its problems, or none. */
export interface PendingDeflectionAssignmentRule {
  check(item: PendingDeflectionAssignment): string[];
}

export class PendingDeflectionAssignmentRequiredCodeRule implements PendingDeflectionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDeflectionAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingDeflectionAssignmentRequiredLabelRule implements PendingDeflectionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDeflectionAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingDeflectionAssignmentRequiredCurrencyRule implements PendingDeflectionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDeflectionAssignment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PendingDeflectionAssignmentCodePrefixRule implements PendingDeflectionAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingDeflectionAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingDeflectionAssignmentLabelLengthRule implements PendingDeflectionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDeflectionAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending deflection assignment. */
export class PendingDeflectionAssignmentValidator {
  rules: PendingDeflectionAssignmentRule[];

  constructor(rules: PendingDeflectionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingDeflectionAssignment): string[] {
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

  requireValid(item: PendingDeflectionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingDeflectionAssignment[]): Map<string, string[]> {
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

export function defaultPendingDeflectionAssignmentValidator(): PendingDeflectionAssignmentValidator {
  return new PendingDeflectionAssignmentValidator(
    [
      new PendingDeflectionAssignmentRequiredCodeRule("pending deflection assignment needs a value"),
      new PendingDeflectionAssignmentRequiredLabelRule("pending deflection assignment needs this field"),
      new PendingDeflectionAssignmentRequiredCurrencyRule("pending deflection assignment needs a value"),
      new PendingDeflectionAssignmentCodePrefixRule("X"),
      new PendingDeflectionAssignmentLabelLengthRule(255),
    ],
  );
}
