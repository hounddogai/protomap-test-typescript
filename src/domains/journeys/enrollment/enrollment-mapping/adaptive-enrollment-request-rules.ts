import { AdaptiveEnrollmentRequest } from "./adaptive-enrollment-request.js";

/** A rule a adaptive enrollment request must pass. Check returns its problems, or none. */
export interface AdaptiveEnrollmentRequestRule {
  check(item: AdaptiveEnrollmentRequest): string[];
}

export class AdaptiveEnrollmentRequestSourceLengthRule implements AdaptiveEnrollmentRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentRequest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveEnrollmentRequestRequiredSourceRule implements AdaptiveEnrollmentRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveEnrollmentRequest): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveEnrollmentRequestRequiredCodeRule implements AdaptiveEnrollmentRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveEnrollmentRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveEnrollmentRequestCodeLengthRule implements AdaptiveEnrollmentRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveEnrollmentRequestGraceDaysRangeRule implements AdaptiveEnrollmentRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveEnrollmentRequest): string[] {
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

/** Runs every rule of a adaptive enrollment request. */
export class AdaptiveEnrollmentRequestValidator {
  rules: AdaptiveEnrollmentRequestRule[];

  constructor(rules: AdaptiveEnrollmentRequestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveEnrollmentRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveEnrollmentRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveEnrollmentRequest[]): Map<string, string[]> {
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

export function defaultAdaptiveEnrollmentRequestValidator(): AdaptiveEnrollmentRequestValidator {
  return new AdaptiveEnrollmentRequestValidator(
    [
      new AdaptiveEnrollmentRequestSourceLengthRule(1000),
      new AdaptiveEnrollmentRequestRequiredSourceRule("adaptive enrollment request needs this field"),
      new AdaptiveEnrollmentRequestRequiredCodeRule("adaptive enrollment request needs a value"),
      new AdaptiveEnrollmentRequestCodeLengthRule(32),
      new AdaptiveEnrollmentRequestGraceDaysRangeRule(80, 255),
    ],
  );
}
