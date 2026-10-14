import * as text from "../../../../kit/text.js";
import { TieredInsightAssignment } from "./tiered-insight-assignment.js";

/** A rule a tiered insight assignment must pass. Check returns its problems, or none. */
export interface TieredInsightAssignmentRule {
  check(item: TieredInsightAssignment): string[];
}

export class TieredInsightAssignmentRequiredTitleRule implements TieredInsightAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInsightAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredInsightAssignmentSourceLengthRule implements TieredInsightAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredInsightAssignment): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredInsightAssignmentAllowedNameRule implements TieredInsightAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredInsightAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class TieredInsightAssignmentCodeLengthRule implements TieredInsightAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredInsightAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredInsightAssignmentTitleLengthRule implements TieredInsightAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredInsightAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered insight assignment. */
export class TieredInsightAssignmentValidator {
  rules: TieredInsightAssignmentRule[];

  constructor(rules: TieredInsightAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredInsightAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredInsightAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredInsightAssignment[]): Map<string, string[]> {
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

export function defaultTieredInsightAssignmentValidator(): TieredInsightAssignmentValidator {
  return new TieredInsightAssignmentValidator(
    [
      new TieredInsightAssignmentRequiredTitleRule("tiered insight assignment needs this field"),
      new TieredInsightAssignmentSourceLengthRule(80),
      new TieredInsightAssignmentAllowedNameRule([]),
      new TieredInsightAssignmentCodeLengthRule(86400),
      new TieredInsightAssignmentTitleLengthRule(3600),
    ],
  );
}
