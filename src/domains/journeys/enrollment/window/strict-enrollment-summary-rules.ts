import { StrictEnrollmentSummary } from "./strict-enrollment-summary.js";

/** A rule a strict enrollment summary must pass. Check returns its problems, or none. */
export interface StrictEnrollmentSummaryRule {
  check(item: StrictEnrollmentSummary): string[];
}

export class StrictEnrollmentSummaryRequiredExternalRefRule implements StrictEnrollmentSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictEnrollmentSummary): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class StrictEnrollmentSummaryRequiredTitleRule implements StrictEnrollmentSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictEnrollmentSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictEnrollmentSummaryArchivedGuardRule implements StrictEnrollmentSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictEnrollmentSummary): string[] {
    if (item.archived && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class StrictEnrollmentSummaryCodeLengthRule implements StrictEnrollmentSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEnrollmentSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictEnrollmentSummaryMinimumRangeRule implements StrictEnrollmentSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictEnrollmentSummary): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictEnrollmentSummaryDescriptionLengthRule implements StrictEnrollmentSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEnrollmentSummary): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict enrollment summary. */
export class StrictEnrollmentSummaryValidator {
  rules: StrictEnrollmentSummaryRule[];

  constructor(rules: StrictEnrollmentSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: StrictEnrollmentSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictEnrollmentSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictEnrollmentSummary[]): Map<string, string[]> {
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

export function defaultStrictEnrollmentSummaryValidator(): StrictEnrollmentSummaryValidator {
  return new StrictEnrollmentSummaryValidator(
    [
      new StrictEnrollmentSummaryRequiredExternalRefRule("strict enrollment summary needs this field"),
      new StrictEnrollmentSummaryRequiredTitleRule("strict enrollment summary needs this field"),
      new StrictEnrollmentSummaryArchivedGuardRule(0.7),
      new StrictEnrollmentSummaryCodeLengthRule(80),
      new StrictEnrollmentSummaryMinimumRangeRule(0.9, 3399.5),
      new StrictEnrollmentSummaryDescriptionLengthRule(1000),
    ],
  );
}
