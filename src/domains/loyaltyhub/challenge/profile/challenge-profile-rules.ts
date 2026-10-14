import { ChallengeProfile } from "./challenge-profile.js";

/** A rule a challenge profile must pass. Check returns its problems, or none. */
export interface ChallengeProfileRule {
  check(item: ChallengeProfile): string[];
}

export class ChallengeProfileTimezoneLengthRule implements ChallengeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeProfile): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeProfileContactEmailLengthRule implements ChallengeProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeProfile): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeProfileBatchSizeRangeRule implements ChallengeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeProfile): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a challenge profile. */
export class ChallengeProfileValidator {
  rules: ChallengeProfileRule[];

  constructor(rules: ChallengeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeProfile[]): Map<string, string[]> {
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

export function defaultChallengeProfileValidator(): ChallengeProfileValidator {
  return new ChallengeProfileValidator(
    [
      new ChallengeProfileTimezoneLengthRule(120),
      new ChallengeProfileContactEmailLengthRule(64),
      new ChallengeProfileBatchSizeRangeRule(120, 86400),
    ],
  );
}
