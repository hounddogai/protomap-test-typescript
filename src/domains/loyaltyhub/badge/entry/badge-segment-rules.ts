import { BadgeSegment } from "./badge-segment.js";

/** A rule a badge segment must pass. Check returns its problems, or none. */
export interface BadgeSegmentRule {
  check(item: BadgeSegment): string[];
}

export class BadgeSegmentNameLengthRule implements BadgeSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeSegmentCapacityRangeRule implements BadgeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeSegment): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeSegmentRegionLengthRule implements BadgeSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeSegment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeSegmentRequiredCodeRule implements BadgeSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeSegmentSourceLengthRule implements BadgeSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeSegment): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a badge segment. */
export class BadgeSegmentValidator {
  rules: BadgeSegmentRule[];

  constructor(rules: BadgeSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeSegment): string[] {
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

  requireValid(item: BadgeSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeSegment[]): Map<string, string[]> {
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

export function defaultBadgeSegmentValidator(): BadgeSegmentValidator {
  return new BadgeSegmentValidator(
    [
      new BadgeSegmentNameLengthRule(80),
      new BadgeSegmentCapacityRangeRule(120, 3600),
      new BadgeSegmentRegionLengthRule(80),
      new BadgeSegmentRequiredCodeRule("badge segment needs an entry"),
      new BadgeSegmentSourceLengthRule(80),
    ],
  );
}
