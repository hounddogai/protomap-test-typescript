import { LenientJourneyAssignment } from "./lenient-journey-assignment.js";

/** A rule a lenient journey assignment must pass. Check returns its problems, or none. */
export interface LenientJourneyAssignmentRule {
  check(item: LenientJourneyAssignment): string[];
}

export class LenientJourneyAssignmentDescriptionLengthRule implements LenientJourneyAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientJourneyAssignment): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientJourneyAssignmentRequiredTimezoneRule implements LenientJourneyAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientJourneyAssignment): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientJourneyAssignmentGraceDaysRangeRule implements LenientJourneyAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientJourneyAssignment): string[] {
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

export class LenientJourneyAssignmentCodePrefixRule implements LenientJourneyAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientJourneyAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient journey assignment. */
export class LenientJourneyAssignmentValidator {
  rules: LenientJourneyAssignmentRule[];

  constructor(rules: LenientJourneyAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientJourneyAssignment): string[] {
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

  requireValid(item: LenientJourneyAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientJourneyAssignment[]): Map<string, string[]> {
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

export function defaultLenientJourneyAssignmentValidator(): LenientJourneyAssignmentValidator {
  return new LenientJourneyAssignmentValidator(
    [
      new LenientJourneyAssignmentDescriptionLengthRule(3600),
      new LenientJourneyAssignmentRequiredTimezoneRule("lenient journey assignment needs an entry"),
      new LenientJourneyAssignmentGraceDaysRangeRule(255, 86400),
      new LenientJourneyAssignmentCodePrefixRule("Q"),
    ],
  );
}
