import { TieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

/** A rule a tiered double opt in assignment must pass. Check returns its problems, or none. */
export interface TieredDoubleOptInAssignmentRule {
  check(item: TieredDoubleOptInAssignment): string[];
}

export class TieredDoubleOptInAssignmentRequiredCodeRule implements TieredDoubleOptInAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDoubleOptInAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDoubleOptInAssignmentPhoneLengthRule implements TieredDoubleOptInAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInAssignment): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDoubleOptInAssignmentRequiredLabelRule implements TieredDoubleOptInAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDoubleOptInAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDoubleOptInAssignmentCodePrefixRule implements TieredDoubleOptInAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredDoubleOptInAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredDoubleOptInAssignmentLabelLengthRule implements TieredDoubleOptInAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDoubleOptInAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered double opt in assignment. */
export class TieredDoubleOptInAssignmentValidator {
  rules: TieredDoubleOptInAssignmentRule[];

  constructor(rules: TieredDoubleOptInAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDoubleOptInAssignment): string[] {
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

  requireValid(item: TieredDoubleOptInAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDoubleOptInAssignment[]): Map<string, string[]> {
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

export function defaultTieredDoubleOptInAssignmentValidator(): TieredDoubleOptInAssignmentValidator {
  return new TieredDoubleOptInAssignmentValidator(
    [
      new TieredDoubleOptInAssignmentRequiredCodeRule("tiered double opt in assignment needs this field"),
      new TieredDoubleOptInAssignmentPhoneLengthRule(86400),
      new TieredDoubleOptInAssignmentRequiredLabelRule("tiered double opt in assignment needs this field"),
      new TieredDoubleOptInAssignmentCodePrefixRule("X"),
      new TieredDoubleOptInAssignmentLabelLengthRule(80),
    ],
  );
}
