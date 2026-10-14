import * as text from "../../../../kit/text.js";
import { TouchpointAssignment } from "./touchpoint-assignment.js";

/** A rule a touchpoint assignment must pass. Check returns its problems, or none. */
export interface TouchpointAssignmentRule {
  check(item: TouchpointAssignment): string[];
}

export class TouchpointAssignmentRequiredTitleRule implements TouchpointAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointAssignmentCodePrefixRule implements TouchpointAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointAssignmentAllowedCohortRule implements TouchpointAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is unknown`];
    return [];
  }
}

export class TouchpointAssignmentLabelLengthRule implements TouchpointAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointAssignment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint assignment. */
export class TouchpointAssignmentValidator {
  rules: TouchpointAssignmentRule[];

  constructor(rules: TouchpointAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointAssignment): string[] {
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

  requireValid(item: TouchpointAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointAssignment[]): Map<string, string[]> {
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

export function defaultTouchpointAssignmentValidator(): TouchpointAssignmentValidator {
  return new TouchpointAssignmentValidator(
    [
      new TouchpointAssignmentRequiredTitleRule("touchpoint assignment needs a value"),
      new TouchpointAssignmentCodePrefixRule("OPS"),
      new TouchpointAssignmentAllowedCohortRule([]),
      new TouchpointAssignmentLabelLengthRule(255),
    ],
  );
}
