import { CappedOptOutAssignment } from "./capped-opt-out-assignment.js";

/** A rule a capped opt out assignment must pass. Check returns its problems, or none. */
export interface CappedOptOutAssignmentRule {
  check(item: CappedOptOutAssignment): string[];
}

export class CappedOptOutAssignmentMarginRangeRule implements CappedOptOutAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedOptOutAssignment): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedOptOutAssignmentCodeLengthRule implements CappedOptOutAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedOptOutAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedOptOutAssignmentTitleLengthRule implements CappedOptOutAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedOptOutAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedOptOutAssignmentRequiredExternalRefRule implements CappedOptOutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedOptOutAssignment): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class CappedOptOutAssignmentRequiredTitleRule implements CappedOptOutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedOptOutAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped opt out assignment. */
export class CappedOptOutAssignmentValidator {
  rules: CappedOptOutAssignmentRule[];

  constructor(rules: CappedOptOutAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: CappedOptOutAssignment): string[] {
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

  requireValid(item: CappedOptOutAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedOptOutAssignment[]): Map<string, string[]> {
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

export function defaultCappedOptOutAssignmentValidator(): CappedOptOutAssignmentValidator {
  return new CappedOptOutAssignmentValidator(
    [
      new CappedOptOutAssignmentMarginRangeRule(6.5, 4561.1),
      new CappedOptOutAssignmentCodeLengthRule(3600),
      new CappedOptOutAssignmentTitleLengthRule(80),
      new CappedOptOutAssignmentRequiredExternalRefRule("capped opt out assignment needs an entry"),
      new CappedOptOutAssignmentRequiredTitleRule("capped opt out assignment needs an entry"),
    ],
  );
}
