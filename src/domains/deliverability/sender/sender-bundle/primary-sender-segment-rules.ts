import { PrimarySenderSegment } from "./primary-sender-segment.js";

/** A rule a primary sender segment must pass. Check returns its problems, or none. */
export interface PrimarySenderSegmentRule {
  check(item: PrimarySenderSegment): string[];
}

export class PrimarySenderSegmentRequiredSourceRule implements PrimarySenderSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderSegment): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySenderSegmentRequiredUtmSourceRule implements PrimarySenderSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderSegment): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySenderSegmentWindowDaysRangeRule implements PrimarySenderSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySenderSegment): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimarySenderSegmentRequiredCodeRule implements PrimarySenderSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySenderSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySenderSegmentLabelLengthRule implements PrimarySenderSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary sender segment. */
export class PrimarySenderSegmentValidator {
  rules: PrimarySenderSegmentRule[];

  constructor(rules: PrimarySenderSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySenderSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySenderSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySenderSegment[]): Map<string, string[]> {
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

export function defaultPrimarySenderSegmentValidator(): PrimarySenderSegmentValidator {
  return new PrimarySenderSegmentValidator(
    [
      new PrimarySenderSegmentRequiredSourceRule("primary sender segment needs a value"),
      new PrimarySenderSegmentRequiredUtmSourceRule("primary sender segment needs an entry"),
      new PrimarySenderSegmentWindowDaysRangeRule(16, 120),
      new PrimarySenderSegmentRequiredCodeRule("primary sender segment needs a value"),
      new PrimarySenderSegmentLabelLengthRule(86400),
    ],
  );
}
