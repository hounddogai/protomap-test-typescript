import { EnrollmentSummary } from "./enrollment-summary.js";

/** A rule a enrollment summary must pass. Check returns its problems, or none. */
export interface EnrollmentSummaryRule {
  check(item: EnrollmentSummary): string[];
}

export class EnrollmentSummaryExternalRefLengthRule implements EnrollmentSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentSummary): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentSummaryCostRangeRule implements EnrollmentSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentSummary): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentSummaryRequiredCodeRule implements EnrollmentSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentSummaryTitleLengthRule implements EnrollmentSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentSummaryCodeLengthRule implements EnrollmentSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment summary. */
export class EnrollmentSummaryValidator {
  rules: EnrollmentSummaryRule[];

  constructor(rules: EnrollmentSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentSummary[]): Map<string, string[]> {
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

export function defaultEnrollmentSummaryValidator(): EnrollmentSummaryValidator {
  return new EnrollmentSummaryValidator(
    [
      new EnrollmentSummaryExternalRefLengthRule(80),
      new EnrollmentSummaryCostRangeRule(3.1, 177.8),
      new EnrollmentSummaryRequiredCodeRule("enrollment summary needs a value"),
      new EnrollmentSummaryTitleLengthRule(32),
      new EnrollmentSummaryCodeLengthRule(86400),
    ],
  );
}
