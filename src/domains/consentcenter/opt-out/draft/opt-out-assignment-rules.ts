import { OptOutAssignment } from "./opt-out-assignment.js";

/** A rule a opt out assignment must pass. Check returns its problems, or none. */
export interface OptOutAssignmentRule {
  check(item: OptOutAssignment): string[];
}

export class OptOutAssignmentRatioRangeRule implements OptOutAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutAssignment): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutAssignmentRequiredCodeRule implements OptOutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutAssignmentRequiredLabelRule implements OptOutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out assignment. */
export class OptOutAssignmentValidator {
  rules: OptOutAssignmentRule[];

  constructor(rules: OptOutAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutAssignment): string[] {
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

  requireValid(item: OptOutAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutAssignment[]): Map<string, string[]> {
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

export function defaultOptOutAssignmentValidator(): OptOutAssignmentValidator {
  return new OptOutAssignmentValidator(
    [
      new OptOutAssignmentRatioRangeRule(4.1, 3684.3),
      new OptOutAssignmentRequiredCodeRule("opt out assignment needs an entry"),
      new OptOutAssignmentRequiredLabelRule("opt out assignment needs this field"),
    ],
  );
}
