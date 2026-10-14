import { ScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

/** A rule a scheduled preference assignment must pass. Check returns its problems, or none. */
export interface ScheduledPreferenceAssignmentRule {
  check(item: ScheduledPreferenceAssignment): string[];
}

export class ScheduledPreferenceAssignmentRequiredTitleRule implements ScheduledPreferenceAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPreferenceAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPreferenceAssignmentCodeLengthRule implements ScheduledPreferenceAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPreferenceAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPreferenceAssignmentTitleLengthRule implements ScheduledPreferenceAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPreferenceAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPreferenceAssignmentSendAtRangeRule implements ScheduledPreferenceAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPreferenceAssignment): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledPreferenceAssignmentRequiredCategoryRule implements ScheduledPreferenceAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPreferenceAssignment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPreferenceAssignmentFrequencyCapRangeRule implements ScheduledPreferenceAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPreferenceAssignment): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled preference assignment. */
export class ScheduledPreferenceAssignmentValidator {
  rules: ScheduledPreferenceAssignmentRule[];

  constructor(rules: ScheduledPreferenceAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPreferenceAssignment): string[] {
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

  requireValid(item: ScheduledPreferenceAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPreferenceAssignment[]): Map<string, string[]> {
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

export function defaultScheduledPreferenceAssignmentValidator(): ScheduledPreferenceAssignmentValidator {
  return new ScheduledPreferenceAssignmentValidator(
    [
      new ScheduledPreferenceAssignmentRequiredTitleRule("scheduled preference assignment needs a value"),
      new ScheduledPreferenceAssignmentCodeLengthRule(16),
      new ScheduledPreferenceAssignmentTitleLengthRule(64),
      new ScheduledPreferenceAssignmentSendAtRangeRule(16, 1000),
      new ScheduledPreferenceAssignmentRequiredCategoryRule("scheduled preference assignment needs an entry"),
      new ScheduledPreferenceAssignmentFrequencyCapRangeRule(16, 255),
    ],
  );
}
