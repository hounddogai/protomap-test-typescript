import { LenientChallengeScore } from "./lenient-challenge-score.js";

/** A rule a lenient challenge score must pass. Check returns its problems, or none. */
export interface LenientChallengeScoreRule {
  check(item: LenientChallengeScore): string[];
}

export class LenientChallengeScoreRequiredPhoneRule implements LenientChallengeScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientChallengeScore): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientChallengeScoreVisibleGuardRule implements LenientChallengeScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientChallengeScore): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LenientChallengeScorePhoneLengthRule implements LenientChallengeScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientChallengeScore): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientChallengeScoreRequiredCodeRule implements LenientChallengeScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientChallengeScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient challenge score. */
export class LenientChallengeScoreValidator {
  rules: LenientChallengeScoreRule[];

  constructor(rules: LenientChallengeScoreRule[]) {
    this.rules = rules;
  }

  validate(item: LenientChallengeScore): string[] {
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

  requireValid(item: LenientChallengeScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientChallengeScore[]): Map<string, string[]> {
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

export function defaultLenientChallengeScoreValidator(): LenientChallengeScoreValidator {
  return new LenientChallengeScoreValidator(
    [
      new LenientChallengeScoreRequiredPhoneRule("lenient challenge score needs this field"),
      new LenientChallengeScoreVisibleGuardRule(16),
      new LenientChallengeScorePhoneLengthRule(86400),
      new LenientChallengeScoreRequiredCodeRule("lenient challenge score needs this field"),
    ],
  );
}
