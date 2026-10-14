import { EnrollmentRequest } from "./enrollment-request.js";

/** A rule a enrollment request must pass. Check returns its problems, or none. */
export interface EnrollmentRequestRule {
  check(item: EnrollmentRequest): string[];
}

export class EnrollmentRequestBidRangeRule implements EnrollmentRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentRequest): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentRequestNotesLengthRule implements EnrollmentRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentRequest): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentRequestRequiredCodeRule implements EnrollmentRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentRequestExpiresAtRangeRule implements EnrollmentRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentRequest): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment request. */
export class EnrollmentRequestValidator {
  rules: EnrollmentRequestRule[];

  constructor(rules: EnrollmentRequestRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentRequest[]): Map<string, string[]> {
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

export function defaultEnrollmentRequestValidator(): EnrollmentRequestValidator {
  return new EnrollmentRequestValidator(
    [
      new EnrollmentRequestBidRangeRule(2.2, 3949),
      new EnrollmentRequestNotesLengthRule(255),
      new EnrollmentRequestRequiredCodeRule("enrollment request needs a value"),
      new EnrollmentRequestExpiresAtRangeRule(32, 80),
    ],
  );
}
