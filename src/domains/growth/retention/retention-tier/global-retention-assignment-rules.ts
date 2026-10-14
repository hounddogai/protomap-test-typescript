import { GlobalRetentionAssignment } from "./global-retention-assignment.js";

/** A rule a global retention assignment must pass. Check returns its problems, or none. */
export interface GlobalRetentionAssignmentRule {
  check(item: GlobalRetentionAssignment): string[];
}

export class GlobalRetentionAssignmentBidRangeRule implements GlobalRetentionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionAssignment): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRetentionAssignmentRequiredCategoryRule implements GlobalRetentionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionAssignment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionAssignmentDiscountRangeRule implements GlobalRetentionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionAssignment): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRetentionAssignmentRequiredTitleRule implements GlobalRetentionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionAssignmentCodeLengthRule implements GlobalRetentionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global retention assignment. */
export class GlobalRetentionAssignmentValidator {
  rules: GlobalRetentionAssignmentRule[];

  constructor(rules: GlobalRetentionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionAssignment): string[] {
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

  requireValid(item: GlobalRetentionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionAssignment[]): Map<string, string[]> {
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

export function defaultGlobalRetentionAssignmentValidator(): GlobalRetentionAssignmentValidator {
  return new GlobalRetentionAssignmentValidator(
    [
      new GlobalRetentionAssignmentBidRangeRule(3.7, 3997.8),
      new GlobalRetentionAssignmentRequiredCategoryRule("global retention assignment needs a value"),
      new GlobalRetentionAssignmentDiscountRangeRule(6.6, 2520.9),
      new GlobalRetentionAssignmentRequiredTitleRule("global retention assignment needs a value"),
      new GlobalRetentionAssignmentCodeLengthRule(80),
    ],
  );
}
