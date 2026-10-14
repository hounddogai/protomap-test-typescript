import { JourneyAssignment } from "./journey-assignment.js";

/** A rule a journey assignment must pass. Check returns its problems, or none. */
export interface JourneyAssignmentRule {
  check(item: JourneyAssignment): string[];
}

export class JourneyAssignmentRequiredTitleRule implements JourneyAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyAssignmentCountryLengthRule implements JourneyAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyAssignment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyAssignmentCodePrefixRule implements JourneyAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyAssignmentTitleLengthRule implements JourneyAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyAssignmentRequiredCodeRule implements JourneyAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyAssignmentPinnedGuardRule implements JourneyAssignmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: JourneyAssignment): string[] {
    if (item.pinned && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a journey assignment. */
export class JourneyAssignmentValidator {
  rules: JourneyAssignmentRule[];

  constructor(rules: JourneyAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyAssignment[]): Map<string, string[]> {
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

export function defaultJourneyAssignmentValidator(): JourneyAssignmentValidator {
  return new JourneyAssignmentValidator(
    [
      new JourneyAssignmentRequiredTitleRule("journey assignment needs this field"),
      new JourneyAssignmentCountryLengthRule(120),
      new JourneyAssignmentCodePrefixRule("X"),
      new JourneyAssignmentTitleLengthRule(80),
      new JourneyAssignmentRequiredCodeRule("journey assignment needs this field"),
      new JourneyAssignmentPinnedGuardRule(86400),
    ],
  );
}
