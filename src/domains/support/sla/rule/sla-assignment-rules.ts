import * as text from "../../../../kit/text.js";
import { SlaAssignment } from "./sla-assignment.js";

/** A rule a sla assignment must pass. Check returns its problems, or none. */
export interface SlaAssignmentRule {
  check(item: SlaAssignment): string[];
}

export class SlaAssignmentAllowedSegmentRule implements SlaAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is expired`];
    return [];
  }
}

export class SlaAssignmentRequiredVariantRule implements SlaAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaAssignment): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SlaAssignmentRequiredNameRule implements SlaAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SlaAssignmentThresholdRangeRule implements SlaAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaAssignment): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaAssignmentVariantLengthRule implements SlaAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaAssignment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla assignment. */
export class SlaAssignmentValidator {
  rules: SlaAssignmentRule[];

  constructor(rules: SlaAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: SlaAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaAssignment[]): Map<string, string[]> {
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

export function defaultSlaAssignmentValidator(): SlaAssignmentValidator {
  return new SlaAssignmentValidator(
    [
      new SlaAssignmentAllowedSegmentRule(["capped"]),
      new SlaAssignmentRequiredVariantRule("sla assignment needs a value"),
      new SlaAssignmentRequiredNameRule("sla assignment needs this field"),
      new SlaAssignmentThresholdRangeRule(3, 3080),
      new SlaAssignmentVariantLengthRule(80),
    ],
  );
}
