import { StrictPayoutAssignment } from "./strict-payout-assignment.js";

/** A rule a strict payout assignment must pass. Check returns its problems, or none. */
export interface StrictPayoutAssignmentRule {
  check(item: StrictPayoutAssignment): string[];
}

export class StrictPayoutAssignmentWindowDaysRangeRule implements StrictPayoutAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPayoutAssignment): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPayoutAssignmentRequiredCodeRule implements StrictPayoutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPayoutAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPayoutAssignmentCodeLengthRule implements StrictPayoutAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPayoutAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict payout assignment. */
export class StrictPayoutAssignmentValidator {
  rules: StrictPayoutAssignmentRule[];

  constructor(rules: StrictPayoutAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPayoutAssignment): string[] {
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

  requireValid(item: StrictPayoutAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPayoutAssignment[]): Map<string, string[]> {
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

export function defaultStrictPayoutAssignmentValidator(): StrictPayoutAssignmentValidator {
  return new StrictPayoutAssignmentValidator(
    [
      new StrictPayoutAssignmentWindowDaysRangeRule(16, 16),
      new StrictPayoutAssignmentRequiredCodeRule("strict payout assignment needs a value"),
      new StrictPayoutAssignmentCodeLengthRule(80),
    ],
  );
}
