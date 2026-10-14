import * as text from "../../../../kit/text.js";
import { DefaultCreativeAssignment } from "./default-creative-assignment.js";

/** A rule a default creative assignment must pass. Check returns its problems, or none. */
export interface DefaultCreativeAssignmentRule {
  check(item: DefaultCreativeAssignment): string[];
}

export class DefaultCreativeAssignmentRequiredNameRule implements DefaultCreativeAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreativeAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCreativeAssignmentAllowedLabelRule implements DefaultCreativeAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultCreativeAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class DefaultCreativeAssignmentDurationMinutesRangeRule implements DefaultCreativeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCreativeAssignment): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default creative assignment. */
export class DefaultCreativeAssignmentValidator {
  rules: DefaultCreativeAssignmentRule[];

  constructor(rules: DefaultCreativeAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCreativeAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultCreativeAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCreativeAssignment[]): Map<string, string[]> {
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

export function defaultDefaultCreativeAssignmentValidator(): DefaultCreativeAssignmentValidator {
  return new DefaultCreativeAssignmentValidator(
    [
      new DefaultCreativeAssignmentRequiredNameRule("default creative assignment needs an entry"),
      new DefaultCreativeAssignmentAllowedLabelRule(["regional", "strict"]),
      new DefaultCreativeAssignmentDurationMinutesRangeRule(80, 255),
    ],
  );
}
