import { ManualEnrollmentSummary } from "./manual-enrollment-summary.js";

/** A rule a manual enrollment summary must pass. Check returns its problems, or none. */
export interface ManualEnrollmentSummaryRule {
  check(item: ManualEnrollmentSummary): string[];
}

export class ManualEnrollmentSummaryDurationMinutesRangeRule implements ManualEnrollmentSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualEnrollmentSummary): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualEnrollmentSummaryCodePrefixRule implements ManualEnrollmentSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualEnrollmentSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualEnrollmentSummaryLabelLengthRule implements ManualEnrollmentSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualEnrollmentSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual enrollment summary. */
export class ManualEnrollmentSummaryValidator {
  rules: ManualEnrollmentSummaryRule[];

  constructor(rules: ManualEnrollmentSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: ManualEnrollmentSummary): string[] {
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

  requireValid(item: ManualEnrollmentSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualEnrollmentSummary[]): Map<string, string[]> {
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

export function defaultManualEnrollmentSummaryValidator(): ManualEnrollmentSummaryValidator {
  return new ManualEnrollmentSummaryValidator(
    [
      new ManualEnrollmentSummaryDurationMinutesRangeRule(120, 1000),
      new ManualEnrollmentSummaryCodePrefixRule("Q"),
      new ManualEnrollmentSummaryLabelLengthRule(80),
    ],
  );
}
