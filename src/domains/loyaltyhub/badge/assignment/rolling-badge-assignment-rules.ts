import { RollingBadgeAssignment } from "./rolling-badge-assignment.js";

/** A rule a rolling badge assignment must pass. Check returns its problems, or none. */
export interface RollingBadgeAssignmentRule {
  check(item: RollingBadgeAssignment): string[];
}

export class RollingBadgeAssignmentCodePrefixRule implements RollingBadgeAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingBadgeAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingBadgeAssignmentBidRangeRule implements RollingBadgeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBadgeAssignment): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingBadgeAssignmentPinnedGuardRule implements RollingBadgeAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingBadgeAssignment): string[] {
    if (item.pinned && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class RollingBadgeAssignmentGraceDaysRangeRule implements RollingBadgeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBadgeAssignment): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingBadgeAssignmentLabelLengthRule implements RollingBadgeAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBadgeAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBadgeAssignmentCodeLengthRule implements RollingBadgeAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBadgeAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling badge assignment. */
export class RollingBadgeAssignmentValidator {
  rules: RollingBadgeAssignmentRule[];

  constructor(rules: RollingBadgeAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBadgeAssignment): string[] {
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

  requireValid(item: RollingBadgeAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBadgeAssignment[]): Map<string, string[]> {
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

export function defaultRollingBadgeAssignmentValidator(): RollingBadgeAssignmentValidator {
  return new RollingBadgeAssignmentValidator(
    [
      new RollingBadgeAssignmentCodePrefixRule("ACM"),
      new RollingBadgeAssignmentBidRangeRule(1.3, 2825.8),
      new RollingBadgeAssignmentPinnedGuardRule(4.6),
      new RollingBadgeAssignmentGraceDaysRangeRule(32, 120),
      new RollingBadgeAssignmentLabelLengthRule(86400),
      new RollingBadgeAssignmentCodeLengthRule(86400),
    ],
  );
}
