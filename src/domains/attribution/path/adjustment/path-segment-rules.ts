import { PathSegment } from "./path-segment.js";

/** A rule a path segment must pass. Check returns its problems, or none. */
export interface PathSegmentRule {
  check(item: PathSegment): string[];
}

export class PathSegmentVariantLengthRule implements PathSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSegment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathSegmentTitleLengthRule implements PathSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathSegmentRequiredCodeRule implements PathSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathSegmentClicksRangeRule implements PathSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathSegment): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathSegmentCountryLengthRule implements PathSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathSegment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path segment. */
export class PathSegmentValidator {
  rules: PathSegmentRule[];

  constructor(rules: PathSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PathSegment): string[] {
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

  requireValid(item: PathSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathSegment[]): Map<string, string[]> {
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

export function defaultPathSegmentValidator(): PathSegmentValidator {
  return new PathSegmentValidator(
    [
      new PathSegmentVariantLengthRule(64),
      new PathSegmentTitleLengthRule(255),
      new PathSegmentRequiredCodeRule("path segment needs this field"),
      new PathSegmentClicksRangeRule(80, 3600),
      new PathSegmentCountryLengthRule(32),
    ],
  );
}
