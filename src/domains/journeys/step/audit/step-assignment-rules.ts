import { StepAssignment } from "./step-assignment.js";

/** A rule a step assignment must pass. Check returns its problems, or none. */
export interface StepAssignmentRule {
  check(item: StepAssignment): string[];
}

export class StepAssignmentRequiredNotesRule implements StepAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAssignment): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class StepAssignmentLocaleLengthRule implements StepAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepAssignment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepAssignmentRetriesRangeRule implements StepAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepAssignment): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepAssignmentNotesLengthRule implements StepAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepAssignment): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepAssignmentRequiredTitleRule implements StepAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StepAssignmentRequiredCodeRule implements StepAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step assignment. */
export class StepAssignmentValidator {
  rules: StepAssignmentRule[];

  constructor(rules: StepAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: StepAssignment): string[] {
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

  requireValid(item: StepAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepAssignment[]): Map<string, string[]> {
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

export function defaultStepAssignmentValidator(): StepAssignmentValidator {
  return new StepAssignmentValidator(
    [
      new StepAssignmentRequiredNotesRule("step assignment needs this field"),
      new StepAssignmentLocaleLengthRule(120),
      new StepAssignmentRetriesRangeRule(80, 1000),
      new StepAssignmentNotesLengthRule(120),
      new StepAssignmentRequiredTitleRule("step assignment needs an entry"),
      new StepAssignmentRequiredCodeRule("step assignment needs this field"),
    ],
  );
}
