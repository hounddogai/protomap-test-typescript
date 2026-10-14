import * as text from "../../../../kit/text.js";
import { LenientPayoutSegment } from "./lenient-payout-segment.js";

/** A rule a lenient payout segment must pass. Check returns its problems, or none. */
export interface LenientPayoutSegmentRule {
  check(item: LenientPayoutSegment): string[];
}

export class LenientPayoutSegmentRetriesRangeRule implements LenientPayoutSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPayoutSegment): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPayoutSegmentWeightRangeRule implements LenientPayoutSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPayoutSegment): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientPayoutSegmentAllowedUnitRule implements LenientPayoutSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPayoutSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a lenient payout segment. */
export class LenientPayoutSegmentValidator {
  rules: LenientPayoutSegmentRule[];

  constructor(rules: LenientPayoutSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPayoutSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPayoutSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPayoutSegment[]): Map<string, string[]> {
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

export function defaultLenientPayoutSegmentValidator(): LenientPayoutSegmentValidator {
  return new LenientPayoutSegmentValidator(
    [
      new LenientPayoutSegmentRetriesRangeRule(16, 80),
      new LenientPayoutSegmentWeightRangeRule(2.7, 3030.8),
      new LenientPayoutSegmentAllowedUnitRule([]),
    ],
  );
}
