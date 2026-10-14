import { PayoutSegment } from "./payout-segment.js";

/** A rule a payout segment must pass. Check returns its problems, or none. */
export interface PayoutSegmentRule {
  check(item: PayoutSegment): string[];
}

export class PayoutSegmentRequiredCohortRule implements PayoutSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutSegment): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutSegmentExpiresAtRangeRule implements PayoutSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutSegment): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutSegmentRequiredCodeRule implements PayoutSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutSegmentLabelLengthRule implements PayoutSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout segment. */
export class PayoutSegmentValidator {
  rules: PayoutSegmentRule[];

  constructor(rules: PayoutSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutSegment): string[] {
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

  requireValid(item: PayoutSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutSegment[]): Map<string, string[]> {
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

export function defaultPayoutSegmentValidator(): PayoutSegmentValidator {
  return new PayoutSegmentValidator(
    [
      new PayoutSegmentRequiredCohortRule("payout segment needs a value"),
      new PayoutSegmentExpiresAtRangeRule(255, 86400),
      new PayoutSegmentRequiredCodeRule("payout segment needs an entry"),
      new PayoutSegmentLabelLengthRule(32),
    ],
  );
}
