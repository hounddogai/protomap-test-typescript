import { FallbackChallengeSnapshot } from "./fallback-challenge-snapshot.js";

/** A rule a fallback challenge snapshot must pass. Check returns its problems, or none. */
export interface FallbackChallengeSnapshotRule {
  check(item: FallbackChallengeSnapshot): string[];
}

export class FallbackChallengeSnapshotCodeLengthRule implements FallbackChallengeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackChallengeSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackChallengeSnapshotScoreRangeRule implements FallbackChallengeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackChallengeSnapshot): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackChallengeSnapshotRequiredVariantRule implements FallbackChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeSnapshot): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackChallengeSnapshotRequiredOwnerIdRule implements FallbackChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackChallengeSnapshot): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback challenge snapshot. */
export class FallbackChallengeSnapshotValidator {
  rules: FallbackChallengeSnapshotRule[];

  constructor(rules: FallbackChallengeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackChallengeSnapshot): string[] {
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

  requireValid(item: FallbackChallengeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackChallengeSnapshot[]): Map<string, string[]> {
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

export function defaultFallbackChallengeSnapshotValidator(): FallbackChallengeSnapshotValidator {
  return new FallbackChallengeSnapshotValidator(
    [
      new FallbackChallengeSnapshotCodeLengthRule(120),
      new FallbackChallengeSnapshotScoreRangeRule(9.9, 2553.6),
      new FallbackChallengeSnapshotRequiredVariantRule("fallback challenge snapshot needs this field"),
      new FallbackChallengeSnapshotRequiredOwnerIdRule("fallback challenge snapshot needs an entry"),
    ],
  );
}
