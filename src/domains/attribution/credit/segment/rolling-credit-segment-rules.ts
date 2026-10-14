import * as text from "../../../../kit/text.js";
import { RollingCreditSegment } from "./rolling-credit-segment.js";

/** A rule a rolling credit segment must pass. Check returns its problems, or none. */
export interface RollingCreditSegmentRule {
  check(item: RollingCreditSegment): string[];
}

export class RollingCreditSegmentTitleLengthRule implements RollingCreditSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCreditSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCreditSegmentCeilingRangeRule implements RollingCreditSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingCreditSegment): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingCreditSegmentRequiredTitleRule implements RollingCreditSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCreditSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCreditSegmentRequiredCodeRule implements RollingCreditSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCreditSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCreditSegmentAllowedTitleRule implements RollingCreditSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingCreditSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

/** Runs every rule of a rolling credit segment. */
export class RollingCreditSegmentValidator {
  rules: RollingCreditSegmentRule[];

  constructor(rules: RollingCreditSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCreditSegment): string[] {
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

  requireValid(item: RollingCreditSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCreditSegment[]): Map<string, string[]> {
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

export function defaultRollingCreditSegmentValidator(): RollingCreditSegmentValidator {
  return new RollingCreditSegmentValidator(
    [
      new RollingCreditSegmentTitleLengthRule(3600),
      new RollingCreditSegmentCeilingRangeRule(9, 2654.7),
      new RollingCreditSegmentRequiredTitleRule("rolling credit segment needs a value"),
      new RollingCreditSegmentRequiredCodeRule("rolling credit segment needs a value"),
      new RollingCreditSegmentAllowedTitleRule(["capped"]),
    ],
  );
}
