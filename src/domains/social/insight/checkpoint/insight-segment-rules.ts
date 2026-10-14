import { InsightSegment } from "./insight-segment.js";

/** A rule a insight segment must pass. Check returns its problems, or none. */
export interface InsightSegmentRule {
  check(item: InsightSegment): string[];
}

export class InsightSegmentRequiredTitleRule implements InsightSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InsightSegmentCodePrefixRule implements InsightSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightSegmentCodeLengthRule implements InsightSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightSegmentRegionLengthRule implements InsightSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightSegment): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightSegmentRequiredCodeRule implements InsightSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight segment. */
export class InsightSegmentValidator {
  rules: InsightSegmentRule[];

  constructor(rules: InsightSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: InsightSegment): string[] {
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

  requireValid(item: InsightSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightSegment[]): Map<string, string[]> {
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

export function defaultInsightSegmentValidator(): InsightSegmentValidator {
  return new InsightSegmentValidator(
    [
      new InsightSegmentRequiredTitleRule("insight segment needs an entry"),
      new InsightSegmentCodePrefixRule("REF"),
      new InsightSegmentCodeLengthRule(80),
      new InsightSegmentRegionLengthRule(32),
      new InsightSegmentRequiredCodeRule("insight segment needs an entry"),
    ],
  );
}
