import * as text from "../../../../kit/text.js";
import { StrictLevelAssignment } from "./strict-level-assignment.js";

/** A rule a strict level assignment must pass. Check returns its problems, or none. */
export interface StrictLevelAssignmentRule {
  check(item: StrictLevelAssignment): string[];
}

export class StrictLevelAssignmentCodeLengthRule implements StrictLevelAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictLevelAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictLevelAssignmentRequiredCodeRule implements StrictLevelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLevelAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictLevelAssignmentCapacityRangeRule implements StrictLevelAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictLevelAssignment): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictLevelAssignmentActiveGuardRule implements StrictLevelAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictLevelAssignment): string[] {
    if (item.active && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while active`];
    return [];
  }
}

export class StrictLevelAssignmentAllowedCodeRule implements StrictLevelAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictLevelAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class StrictLevelAssignmentRequiredContactEmailRule implements StrictLevelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLevelAssignment): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict level assignment. */
export class StrictLevelAssignmentValidator {
  rules: StrictLevelAssignmentRule[];

  constructor(rules: StrictLevelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictLevelAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictLevelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictLevelAssignment[]): Map<string, string[]> {
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

export function defaultStrictLevelAssignmentValidator(): StrictLevelAssignmentValidator {
  return new StrictLevelAssignmentValidator(
    [
      new StrictLevelAssignmentCodeLengthRule(64),
      new StrictLevelAssignmentRequiredCodeRule("strict level assignment needs an entry"),
      new StrictLevelAssignmentCapacityRangeRule(1000, 3600),
      new StrictLevelAssignmentActiveGuardRule(64),
      new StrictLevelAssignmentAllowedCodeRule(["strict", "strict"]),
      new StrictLevelAssignmentRequiredContactEmailRule("strict level assignment needs this field"),
    ],
  );
}
