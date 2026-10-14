import { FallbackCreditSegment } from "./fallback-credit-segment.js";

/** A rule a fallback credit segment must pass. Check returns its problems, or none. */
export interface FallbackCreditSegmentRule {
  check(item: FallbackCreditSegment): string[];
}

export class FallbackCreditSegmentSequenceRangeRule implements FallbackCreditSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreditSegment): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackCreditSegmentLabelLengthRule implements FallbackCreditSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCreditSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCreditSegmentRequiredLabelRule implements FallbackCreditSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback credit segment. */
export class FallbackCreditSegmentValidator {
  rules: FallbackCreditSegmentRule[];

  constructor(rules: FallbackCreditSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreditSegment): string[] {
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

  requireValid(item: FallbackCreditSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreditSegment[]): Map<string, string[]> {
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

export function defaultFallbackCreditSegmentValidator(): FallbackCreditSegmentValidator {
  return new FallbackCreditSegmentValidator(
    [
      new FallbackCreditSegmentSequenceRangeRule(255, 1000),
      new FallbackCreditSegmentLabelLengthRule(32),
      new FallbackCreditSegmentRequiredLabelRule("fallback credit segment needs a value"),
    ],
  );
}
