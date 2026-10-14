import { LenientPacingSegment } from "./lenient-pacing-segment.js";

/** A rule a lenient pacing segment must pass. Check returns its problems, or none. */
export interface LenientPacingSegmentRule {
  check(item: LenientPacingSegment): string[];
}

export class LenientPacingSegmentFrequencyCapRangeRule implements LenientPacingSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPacingSegment): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientPacingSegmentRequiredTitleRule implements LenientPacingSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPacingSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPacingSegmentRequiredNameRule implements LenientPacingSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPacingSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPacingSegmentAttemptsRangeRule implements LenientPacingSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPacingSegment): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientPacingSegmentCodeLengthRule implements LenientPacingSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPacingSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient pacing segment. */
export class LenientPacingSegmentValidator {
  rules: LenientPacingSegmentRule[];

  constructor(rules: LenientPacingSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPacingSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientPacingSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPacingSegment[]): Map<string, string[]> {
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

export function defaultLenientPacingSegmentValidator(): LenientPacingSegmentValidator {
  return new LenientPacingSegmentValidator(
    [
      new LenientPacingSegmentFrequencyCapRangeRule(64, 3600),
      new LenientPacingSegmentRequiredTitleRule("lenient pacing segment needs a value"),
      new LenientPacingSegmentRequiredNameRule("lenient pacing segment needs an entry"),
      new LenientPacingSegmentAttemptsRangeRule(80, 80),
      new LenientPacingSegmentCodeLengthRule(16),
    ],
  );
}
