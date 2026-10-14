import { LenientRetentionAssignment } from "./lenient-retention-assignment.js";

/** A rule a lenient retention assignment must pass. Check returns its problems, or none. */
export interface LenientRetentionAssignmentRule {
  check(item: LenientRetentionAssignment): string[];
}

export class LenientRetentionAssignmentUtmSourceLengthRule implements LenientRetentionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRetentionAssignment): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRetentionAssignmentRequiredNameRule implements LenientRetentionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRetentionAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRetentionAssignmentLimitRangeRule implements LenientRetentionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRetentionAssignment): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientRetentionAssignmentCodePrefixRule implements LenientRetentionAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientRetentionAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientRetentionAssignmentRequiredUtmSourceRule implements LenientRetentionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRetentionAssignment): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRetentionAssignmentNameLengthRule implements LenientRetentionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRetentionAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient retention assignment. */
export class LenientRetentionAssignmentValidator {
  rules: LenientRetentionAssignmentRule[];

  constructor(rules: LenientRetentionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRetentionAssignment): string[] {
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

  requireValid(item: LenientRetentionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRetentionAssignment[]): Map<string, string[]> {
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

export function defaultLenientRetentionAssignmentValidator(): LenientRetentionAssignmentValidator {
  return new LenientRetentionAssignmentValidator(
    [
      new LenientRetentionAssignmentUtmSourceLengthRule(86400),
      new LenientRetentionAssignmentRequiredNameRule("lenient retention assignment needs this field"),
      new LenientRetentionAssignmentLimitRangeRule(1000, 3600),
      new LenientRetentionAssignmentCodePrefixRule("X"),
      new LenientRetentionAssignmentRequiredUtmSourceRule("lenient retention assignment needs an entry"),
      new LenientRetentionAssignmentNameLengthRule(86400),
    ],
  );
}
