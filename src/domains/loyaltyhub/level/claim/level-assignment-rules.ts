import { LevelAssignment } from "./level-assignment.js";

/** A rule a level assignment must pass. Check returns its problems, or none. */
export interface LevelAssignmentRule {
  check(item: LevelAssignment): string[];
}

export class LevelAssignmentRatioRangeRule implements LevelAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelAssignment): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelAssignmentBudgetRangeRule implements LevelAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelAssignment): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelAssignmentCodePrefixRule implements LevelAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a level assignment. */
export class LevelAssignmentValidator {
  rules: LevelAssignmentRule[];

  constructor(rules: LevelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LevelAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelAssignment[]): Map<string, string[]> {
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

export function defaultLevelAssignmentValidator(): LevelAssignmentValidator {
  return new LevelAssignmentValidator(
    [
      new LevelAssignmentRatioRangeRule(6.7, 3928.3),
      new LevelAssignmentBudgetRangeRule(2.8, 1968.5),
      new LevelAssignmentCodePrefixRule("Q"),
    ],
  );
}
