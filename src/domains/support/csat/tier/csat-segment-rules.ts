import { CsatSegment } from "./csat-segment.js";

/** A rule a csat segment must pass. Check returns its problems, or none. */
export interface CsatSegmentRule {
  check(item: CsatSegment): string[];
}

export class CsatSegmentTitleLengthRule implements CsatSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatSegmentCodePrefixRule implements CsatSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatSegmentRatioRangeRule implements CsatSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatSegment): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a csat segment. */
export class CsatSegmentValidator {
  rules: CsatSegmentRule[];

  constructor(rules: CsatSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: CsatSegment): string[] {
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

  requireValid(item: CsatSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatSegment[]): Map<string, string[]> {
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

export function defaultCsatSegmentValidator(): CsatSegmentValidator {
  return new CsatSegmentValidator(
    [
      new CsatSegmentTitleLengthRule(120),
      new CsatSegmentCodePrefixRule("ACM"),
      new CsatSegmentRatioRangeRule(1.5, 2781.3),
    ],
  );
}
