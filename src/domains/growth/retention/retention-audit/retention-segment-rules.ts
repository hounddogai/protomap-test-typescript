import { RetentionSegment } from "./retention-segment.js";

/** A rule a retention segment must pass. Check returns its problems, or none. */
export interface RetentionSegmentRule {
  check(item: RetentionSegment): string[];
}

export class RetentionSegmentCodeLengthRule implements RetentionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionSegmentFloorValueRangeRule implements RetentionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionSegment): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionSegmentVersionRangeRule implements RetentionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionSegment): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a retention segment. */
export class RetentionSegmentValidator {
  rules: RetentionSegmentRule[];

  constructor(rules: RetentionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionSegment[]): Map<string, string[]> {
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

export function defaultRetentionSegmentValidator(): RetentionSegmentValidator {
  return new RetentionSegmentValidator(
    [
      new RetentionSegmentCodeLengthRule(80),
      new RetentionSegmentFloorValueRangeRule(9.8, 4251.9),
      new RetentionSegmentVersionRangeRule(16, 80),
    ],
  );
}
