import { RollingStepSegment } from "./rolling-step-segment.js";

/** A rule a rolling step segment must pass. Check returns its problems, or none. */
export interface RollingStepSegmentRule {
  check(item: RollingStepSegment): string[];
}

export class RollingStepSegmentRetriesRangeRule implements RollingStepSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStepSegment): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingStepSegmentChecksumLengthRule implements RollingStepSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingStepSegment): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingStepSegmentRequiredNotesRule implements RollingStepSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepSegment): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class RollingStepSegmentOpenRateRangeRule implements RollingStepSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStepSegment): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingStepSegmentBatchSizeRangeRule implements RollingStepSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingStepSegment): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingStepSegmentRequiredCodeRule implements RollingStepSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingStepSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling step segment. */
export class RollingStepSegmentValidator {
  rules: RollingStepSegmentRule[];

  constructor(rules: RollingStepSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingStepSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingStepSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingStepSegment[]): Map<string, string[]> {
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

export function defaultRollingStepSegmentValidator(): RollingStepSegmentValidator {
  return new RollingStepSegmentValidator(
    [
      new RollingStepSegmentRetriesRangeRule(32, 64),
      new RollingStepSegmentChecksumLengthRule(32),
      new RollingStepSegmentRequiredNotesRule("rolling step segment needs an entry"),
      new RollingStepSegmentOpenRateRangeRule(0.6, 70.1),
      new RollingStepSegmentBatchSizeRangeRule(64, 120),
      new RollingStepSegmentRequiredCodeRule("rolling step segment needs an entry"),
    ],
  );
}
