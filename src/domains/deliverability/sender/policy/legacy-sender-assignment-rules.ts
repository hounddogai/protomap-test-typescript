import { LegacySenderAssignment } from "./legacy-sender-assignment.js";

/** A rule a legacy sender assignment must pass. Check returns its problems, or none. */
export interface LegacySenderAssignmentRule {
  check(item: LegacySenderAssignment): string[];
}

export class LegacySenderAssignmentSegmentLengthRule implements LegacySenderAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacySenderAssignment): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacySenderAssignmentCodePrefixRule implements LegacySenderAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacySenderAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacySenderAssignmentRequiredCodeRule implements LegacySenderAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacySenderAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacySenderAssignmentSequenceRangeRule implements LegacySenderAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacySenderAssignment): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy sender assignment. */
export class LegacySenderAssignmentValidator {
  rules: LegacySenderAssignmentRule[];

  constructor(rules: LegacySenderAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacySenderAssignment): string[] {
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

  requireValid(item: LegacySenderAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacySenderAssignment[]): Map<string, string[]> {
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

export function defaultLegacySenderAssignmentValidator(): LegacySenderAssignmentValidator {
  return new LegacySenderAssignmentValidator(
    [
      new LegacySenderAssignmentSegmentLengthRule(80),
      new LegacySenderAssignmentCodePrefixRule("X"),
      new LegacySenderAssignmentRequiredCodeRule("legacy sender assignment needs this field"),
      new LegacySenderAssignmentSequenceRangeRule(64, 120),
    ],
  );
}
