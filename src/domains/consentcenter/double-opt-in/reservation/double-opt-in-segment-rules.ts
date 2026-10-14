import { DoubleOptInSegment } from "./double-opt-in-segment.js";

/** A rule a double opt in segment must pass. Check returns its problems, or none. */
export interface DoubleOptInSegmentRule {
  check(item: DoubleOptInSegment): string[];
}

export class DoubleOptInSegmentUpdatedAtRangeRule implements DoubleOptInSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInSegment): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInSegmentUnitLengthRule implements DoubleOptInSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInSegment): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInSegmentCodePrefixRule implements DoubleOptInSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInSegmentRequiredCategoryRule implements DoubleOptInSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInSegment): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInSegmentBatchSizeRangeRule implements DoubleOptInSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInSegment): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a double opt in segment. */
export class DoubleOptInSegmentValidator {
  rules: DoubleOptInSegmentRule[];

  constructor(rules: DoubleOptInSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInSegment): string[] {
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

  requireValid(item: DoubleOptInSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInSegment[]): Map<string, string[]> {
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

export function defaultDoubleOptInSegmentValidator(): DoubleOptInSegmentValidator {
  return new DoubleOptInSegmentValidator(
    [
      new DoubleOptInSegmentUpdatedAtRangeRule(1000, 3600),
      new DoubleOptInSegmentUnitLengthRule(120),
      new DoubleOptInSegmentCodePrefixRule("REF"),
      new DoubleOptInSegmentRequiredCategoryRule("double opt in segment needs this field"),
      new DoubleOptInSegmentBatchSizeRangeRule(64, 86400),
    ],
  );
}
