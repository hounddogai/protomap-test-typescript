import { RedemptionSegment } from "./redemption-segment.js";

/** A rule a redemption segment must pass. Check returns its problems, or none. */
export interface RedemptionSegmentRule {
  check(item: RedemptionSegment): string[];
}

export class RedemptionSegmentAttemptsRangeRule implements RedemptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionSegment): string[] {
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

export class RedemptionSegmentCodePrefixRule implements RedemptionSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionSegmentVisibleGuardRule implements RedemptionSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RedemptionSegment): string[] {
    if (item.visible && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RedemptionSegmentCodeLengthRule implements RedemptionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption segment. */
export class RedemptionSegmentValidator {
  rules: RedemptionSegmentRule[];

  constructor(rules: RedemptionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionSegment): string[] {
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

  requireValid(item: RedemptionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionSegment[]): Map<string, string[]> {
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

export function defaultRedemptionSegmentValidator(): RedemptionSegmentValidator {
  return new RedemptionSegmentValidator(
    [
      new RedemptionSegmentAttemptsRangeRule(120, 1000),
      new RedemptionSegmentCodePrefixRule("REF"),
      new RedemptionSegmentVisibleGuardRule(3600),
      new RedemptionSegmentCodeLengthRule(3600),
    ],
  );
}
