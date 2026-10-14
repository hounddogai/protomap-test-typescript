import { PacingSegment } from "./pacing-segment.js";

/** A rule a pacing segment must pass. Check returns its problems, or none. */
export interface PacingSegmentRule {
  check(item: PacingSegment): string[];
}

export class PacingSegmentNameLengthRule implements PacingSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingSegmentCostRangeRule implements PacingSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingSegment): string[] {
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

export class PacingSegmentCodePrefixRule implements PacingSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingSegmentRateRangeRule implements PacingSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingSegment): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingSegmentAttemptsRangeRule implements PacingSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingSegment): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pacing segment. */
export class PacingSegmentValidator {
  rules: PacingSegmentRule[];

  constructor(rules: PacingSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PacingSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingSegment[]): Map<string, string[]> {
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

export function defaultPacingSegmentValidator(): PacingSegmentValidator {
  return new PacingSegmentValidator(
    [
      new PacingSegmentNameLengthRule(32),
      new PacingSegmentCostRangeRule(6.5, 2783.2),
      new PacingSegmentCodePrefixRule("Q"),
      new PacingSegmentRateRangeRule(5.7, 4175.4),
      new PacingSegmentAttemptsRangeRule(120, 255),
    ],
  );
}
