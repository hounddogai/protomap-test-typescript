import { WindowAssignment } from "./window-assignment.js";

/** A rule a window assignment must pass. Check returns its problems, or none. */
export interface WindowAssignmentRule {
  check(item: WindowAssignment): string[];
}

export class WindowAssignmentBudgetRangeRule implements WindowAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowAssignment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowAssignmentNameLengthRule implements WindowAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowAssignmentNotesLengthRule implements WindowAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowAssignment): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowAssignmentRequiredNotesRule implements WindowAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowAssignment): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class WindowAssignmentRequiredNameRule implements WindowAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WindowAssignmentCodePrefixRule implements WindowAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a window assignment. */
export class WindowAssignmentValidator {
  rules: WindowAssignmentRule[];

  constructor(rules: WindowAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: WindowAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowAssignment[]): Map<string, string[]> {
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

export function defaultWindowAssignmentValidator(): WindowAssignmentValidator {
  return new WindowAssignmentValidator(
    [
      new WindowAssignmentBudgetRangeRule(8.7, 278.2),
      new WindowAssignmentNameLengthRule(86400),
      new WindowAssignmentNotesLengthRule(1000),
      new WindowAssignmentRequiredNotesRule("window assignment needs this field"),
      new WindowAssignmentRequiredNameRule("window assignment needs a value"),
      new WindowAssignmentCodePrefixRule("ACM"),
    ],
  );
}
