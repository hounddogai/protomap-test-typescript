import * as text from "../../../../kit/text.js";
import { LegacyOptOutSegment } from "./legacy-opt-out-segment.js";

/** A rule a legacy opt out segment must pass. Check returns its problems, or none. */
export interface LegacyOptOutSegmentRule {
  check(item: LegacyOptOutSegment): string[];
}

export class LegacyOptOutSegmentMaximumRangeRule implements LegacyOptOutSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyOptOutSegment): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyOptOutSegmentAllowedCodeRule implements LegacyOptOutSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyOptOutSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class LegacyOptOutSegmentVisibleGuardRule implements LegacyOptOutSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyOptOutSegment): string[] {
    if (item.visible && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LegacyOptOutSegmentCodePrefixRule implements LegacyOptOutSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyOptOutSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy opt out segment. */
export class LegacyOptOutSegmentValidator {
  rules: LegacyOptOutSegmentRule[];

  constructor(rules: LegacyOptOutSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyOptOutSegment): string[] {
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

  requireValid(item: LegacyOptOutSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyOptOutSegment[]): Map<string, string[]> {
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

export function defaultLegacyOptOutSegmentValidator(): LegacyOptOutSegmentValidator {
  return new LegacyOptOutSegmentValidator(
    [
      new LegacyOptOutSegmentMaximumRangeRule(2, 1838.8),
      new LegacyOptOutSegmentAllowedCodeRule(["regional", "weighted"]),
      new LegacyOptOutSegmentVisibleGuardRule(0.1),
      new LegacyOptOutSegmentCodePrefixRule("Q"),
    ],
  );
}
