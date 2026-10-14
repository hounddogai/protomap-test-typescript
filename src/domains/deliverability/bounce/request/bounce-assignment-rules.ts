import * as text from "../../../../kit/text.js";
import { BounceAssignment } from "./bounce-assignment.js";

/** A rule a bounce assignment must pass. Check returns its problems, or none. */
export interface BounceAssignmentRule {
  check(item: BounceAssignment): string[];
}

export class BounceAssignmentPinnedGuardRule implements BounceAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BounceAssignment): string[] {
    if (item.pinned && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class BounceAssignmentTitleLengthRule implements BounceAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceAssignmentRequiredTitleRule implements BounceAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BounceAssignmentRequiredLabelRule implements BounceAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BounceAssignmentAllowedTitleRule implements BounceAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

/** Runs every rule of a bounce assignment. */
export class BounceAssignmentValidator {
  rules: BounceAssignmentRule[];

  constructor(rules: BounceAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: BounceAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceAssignment[]): Map<string, string[]> {
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

export function defaultBounceAssignmentValidator(): BounceAssignmentValidator {
  return new BounceAssignmentValidator(
    [
      new BounceAssignmentPinnedGuardRule(80),
      new BounceAssignmentTitleLengthRule(3600),
      new BounceAssignmentRequiredTitleRule("bounce assignment needs a value"),
      new BounceAssignmentRequiredLabelRule("bounce assignment needs a value"),
      new BounceAssignmentAllowedTitleRule(["default", "global", "seasonal"]),
    ],
  );
}
