import * as text from "../../../../kit/text.js";
import { ChallengeScore } from "./challenge-score.js";

/** A rule a challenge score must pass. Check returns its problems, or none. */
export interface ChallengeScoreRule {
  check(item: ChallengeScore): string[];
}

export class ChallengeScoreOpenRateRangeRule implements ChallengeScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeScore): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeScoreRequiredTitleRule implements ChallengeScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeScoreAllowedRegionRule implements ChallengeScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is duplicated`];
    return [];
  }
}

/** Runs every rule of a challenge score. */
export class ChallengeScoreValidator {
  rules: ChallengeScoreRule[];

  constructor(rules: ChallengeScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeScore): string[] {
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

  requireValid(item: ChallengeScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeScore[]): Map<string, string[]> {
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

export function defaultChallengeScoreValidator(): ChallengeScoreValidator {
  return new ChallengeScoreValidator(
    [
      new ChallengeScoreOpenRateRangeRule(9.7, 4940.6),
      new ChallengeScoreRequiredTitleRule("challenge score needs an entry"),
      new ChallengeScoreAllowedRegionRule([]),
    ],
  );
}
