import * as text from "../../../../kit/text.js";
import { ScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

/** A rule a scheduled creative assignment must pass. Check returns its problems, or none. */
export interface ScheduledCreativeAssignmentRule {
  check(item: ScheduledCreativeAssignment): string[];
}

export class ScheduledCreativeAssignmentMaximumRangeRule implements ScheduledCreativeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreativeAssignment): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledCreativeAssignmentRatioRangeRule implements ScheduledCreativeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCreativeAssignment): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledCreativeAssignmentTagsLimitRule implements ScheduledCreativeAssignmentRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledCreativeAssignment): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ScheduledCreativeAssignmentRequiredNotesRule implements ScheduledCreativeAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCreativeAssignment): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCreativeAssignmentTitleLengthRule implements ScheduledCreativeAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCreativeAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCreativeAssignmentAllowedUtmSourceRule implements ScheduledCreativeAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledCreativeAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

/** Runs every rule of a scheduled creative assignment. */
export class ScheduledCreativeAssignmentValidator {
  rules: ScheduledCreativeAssignmentRule[];

  constructor(rules: ScheduledCreativeAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCreativeAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCreativeAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCreativeAssignment[]): Map<string, string[]> {
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

export function defaultScheduledCreativeAssignmentValidator(): ScheduledCreativeAssignmentValidator {
  return new ScheduledCreativeAssignmentValidator(
    [
      new ScheduledCreativeAssignmentMaximumRangeRule(2.1, 4164.1),
      new ScheduledCreativeAssignmentRatioRangeRule(9.5, 2873.2),
      new ScheduledCreativeAssignmentTagsLimitRule(32, ["lenient"]),
      new ScheduledCreativeAssignmentRequiredNotesRule("scheduled creative assignment needs a value"),
      new ScheduledCreativeAssignmentTitleLengthRule(255),
      new ScheduledCreativeAssignmentAllowedUtmSourceRule(["default"]),
    ],
  );
}
