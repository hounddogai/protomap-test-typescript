import { ChallengeThreshold } from "./challenge-threshold.js";

/** A rule a challenge threshold must pass. Check returns its problems, or none. */
export interface ChallengeThresholdRule {
  check(item: ChallengeThreshold): string[];
}

export class ChallengeThresholdRequiredVariantRule implements ChallengeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeThreshold): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeThresholdNameLengthRule implements ChallengeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeThresholdDescriptionLengthRule implements ChallengeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeThreshold): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeThresholdRequiredDescriptionRule implements ChallengeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeThreshold): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeThresholdVisibleGuardRule implements ChallengeThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ChallengeThreshold): string[] {
    if (item.visible && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ChallengeThresholdScoreRangeRule implements ChallengeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeThreshold): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a challenge threshold. */
export class ChallengeThresholdValidator {
  rules: ChallengeThresholdRule[];

  constructor(rules: ChallengeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeThreshold): string[] {
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

  requireValid(item: ChallengeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeThreshold[]): Map<string, string[]> {
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

export function defaultChallengeThresholdValidator(): ChallengeThresholdValidator {
  return new ChallengeThresholdValidator(
    [
      new ChallengeThresholdRequiredVariantRule("challenge threshold needs this field"),
      new ChallengeThresholdNameLengthRule(3600),
      new ChallengeThresholdDescriptionLengthRule(80),
      new ChallengeThresholdRequiredDescriptionRule("challenge threshold needs this field"),
      new ChallengeThresholdVisibleGuardRule(4.4),
      new ChallengeThresholdScoreRangeRule(5.9, 1106.1),
    ],
  );
}
