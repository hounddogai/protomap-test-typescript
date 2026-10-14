import { LenientSenderSegment } from "./lenient-sender-segment.js";

/** A rule a lenient sender segment must pass. Check returns its problems, or none. */
export interface LenientSenderSegmentRule {
  check(item: LenientSenderSegment): string[];
}

export class LenientSenderSegmentAmountRangeRule implements LenientSenderSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSenderSegment): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSenderSegmentLimitRangeRule implements LenientSenderSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSenderSegment): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSenderSegmentRequiredNameRule implements LenientSenderSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSenderSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSenderSegmentBudgetRangeRule implements LenientSenderSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSenderSegment): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientSenderSegmentCodeLengthRule implements LenientSenderSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSenderSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient sender segment. */
export class LenientSenderSegmentValidator {
  rules: LenientSenderSegmentRule[];

  constructor(rules: LenientSenderSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSenderSegment): string[] {
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

  requireValid(item: LenientSenderSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSenderSegment[]): Map<string, string[]> {
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

export function defaultLenientSenderSegmentValidator(): LenientSenderSegmentValidator {
  return new LenientSenderSegmentValidator(
    [
      new LenientSenderSegmentAmountRangeRule(3.2, 588.6),
      new LenientSenderSegmentLimitRangeRule(16, 120),
      new LenientSenderSegmentRequiredNameRule("lenient sender segment needs a value"),
      new LenientSenderSegmentBudgetRangeRule(6.5, 3292.4),
      new LenientSenderSegmentCodeLengthRule(1000),
    ],
  );
}
