import * as text from "../../../../kit/text.js";
import { LenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

/** A rule a lenient leaderboard segment must pass. Check returns its problems, or none. */
export interface LenientLeaderboardSegmentRule {
  check(item: LenientLeaderboardSegment): string[];
}

export class LenientLeaderboardSegmentCodeLengthRule implements LenientLeaderboardSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientLeaderboardSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientLeaderboardSegmentRevisionRangeRule implements LenientLeaderboardSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientLeaderboardSegment): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientLeaderboardSegmentUtmSourceLengthRule implements LenientLeaderboardSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientLeaderboardSegment): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientLeaderboardSegmentAllowedNameRule implements LenientLeaderboardSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientLeaderboardSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

export class LenientLeaderboardSegmentUpdatedAtRangeRule implements LenientLeaderboardSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientLeaderboardSegment): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientLeaderboardSegmentRequiredNameRule implements LenientLeaderboardSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientLeaderboardSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient leaderboard segment. */
export class LenientLeaderboardSegmentValidator {
  rules: LenientLeaderboardSegmentRule[];

  constructor(rules: LenientLeaderboardSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientLeaderboardSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientLeaderboardSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientLeaderboardSegment[]): Map<string, string[]> {
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

export function defaultLenientLeaderboardSegmentValidator(): LenientLeaderboardSegmentValidator {
  return new LenientLeaderboardSegmentValidator(
    [
      new LenientLeaderboardSegmentCodeLengthRule(3600),
      new LenientLeaderboardSegmentRevisionRangeRule(64, 120),
      new LenientLeaderboardSegmentUtmSourceLengthRule(16),
      new LenientLeaderboardSegmentAllowedNameRule(["default"]),
      new LenientLeaderboardSegmentUpdatedAtRangeRule(16, 3600),
      new LenientLeaderboardSegmentRequiredNameRule("lenient leaderboard segment needs this field"),
    ],
  );
}
