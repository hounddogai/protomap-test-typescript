import * as text from "../../../../kit/text.js";
import { StreakSegment } from "./streak-segment.js";

/** A rule a streak segment must pass. Check returns its problems, or none. */
export interface StreakSegmentRule {
  check(item: StreakSegment): string[];
}

export class StreakSegmentCodeLengthRule implements StreakSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakSegmentAllowedNameRule implements StreakSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class StreakSegmentRequiredSegmentRule implements StreakSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakSegment): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class StreakSegmentRequiredCodeRule implements StreakSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak segment. */
export class StreakSegmentValidator {
  rules: StreakSegmentRule[];

  constructor(rules: StreakSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: StreakSegment): string[] {
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

  requireValid(item: StreakSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakSegment[]): Map<string, string[]> {
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

export function defaultStreakSegmentValidator(): StreakSegmentValidator {
  return new StreakSegmentValidator(
    [
      new StreakSegmentCodeLengthRule(120),
      new StreakSegmentAllowedNameRule(["regional", "adaptive", "lenient"]),
      new StreakSegmentRequiredSegmentRule("streak segment needs an entry"),
      new StreakSegmentRequiredCodeRule("streak segment needs this field"),
    ],
  );
}
