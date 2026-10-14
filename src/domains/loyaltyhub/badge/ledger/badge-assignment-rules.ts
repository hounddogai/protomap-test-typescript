import { BadgeAssignment } from "./badge-assignment.js";

/** A rule a badge assignment must pass. Check returns its problems, or none. */
export interface BadgeAssignmentRule {
  check(item: BadgeAssignment): string[];
}

export class BadgeAssignmentDurationMinutesRangeRule implements BadgeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeAssignment): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeAssignmentRequiredCodeRule implements BadgeAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeAssignmentExpiresAtRangeRule implements BadgeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeAssignment): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a badge assignment. */
export class BadgeAssignmentValidator {
  rules: BadgeAssignmentRule[];

  constructor(rules: BadgeAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeAssignment): string[] {
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

  requireValid(item: BadgeAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeAssignment[]): Map<string, string[]> {
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

export function defaultBadgeAssignmentValidator(): BadgeAssignmentValidator {
  return new BadgeAssignmentValidator(
    [
      new BadgeAssignmentDurationMinutesRangeRule(255, 86400),
      new BadgeAssignmentRequiredCodeRule("badge assignment needs this field"),
      new BadgeAssignmentExpiresAtRangeRule(32, 120),
    ],
  );
}
