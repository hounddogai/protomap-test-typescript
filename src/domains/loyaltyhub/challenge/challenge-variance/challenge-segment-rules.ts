import { ChallengeSegment } from "./challenge-segment.js";

/** A rule a challenge segment must pass. Check returns its problems, or none. */
export interface ChallengeSegmentRule {
  check(item: ChallengeSegment): string[];
}

export class ChallengeSegmentImpressionsRangeRule implements ChallengeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSegment): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeSegmentRequiredCodeRule implements ChallengeSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeSegmentRateRangeRule implements ChallengeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSegment): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeSegmentCodeLengthRule implements ChallengeSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeSegmentWeightRangeRule implements ChallengeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeSegment): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a challenge segment. */
export class ChallengeSegmentValidator {
  rules: ChallengeSegmentRule[];

  constructor(rules: ChallengeSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeSegment): string[] {
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

  requireValid(item: ChallengeSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeSegment[]): Map<string, string[]> {
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

export function defaultChallengeSegmentValidator(): ChallengeSegmentValidator {
  return new ChallengeSegmentValidator(
    [
      new ChallengeSegmentImpressionsRangeRule(255, 86400),
      new ChallengeSegmentRequiredCodeRule("challenge segment needs an entry"),
      new ChallengeSegmentRateRangeRule(3.1, 3623),
      new ChallengeSegmentCodeLengthRule(16),
      new ChallengeSegmentWeightRangeRule(6.1, 2756),
    ],
  );
}
