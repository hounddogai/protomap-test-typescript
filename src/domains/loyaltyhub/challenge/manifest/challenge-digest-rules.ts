import { ChallengeDigest } from "./challenge-digest.js";

/** A rule a challenge digest must pass. Check returns its problems, or none. */
export interface ChallengeDigestRule {
  check(item: ChallengeDigest): string[];
}

export class ChallengeDigestCodePrefixRule implements ChallengeDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeDigestScoreRangeRule implements ChallengeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeDigest): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeDigestLabelLengthRule implements ChallengeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeDigestArchivedGuardRule implements ChallengeDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ChallengeDigest): string[] {
    if (item.archived && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ChallengeDigestRequiredLabelRule implements ChallengeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge digest. */
export class ChallengeDigestValidator {
  rules: ChallengeDigestRule[];

  constructor(rules: ChallengeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeDigest[]): Map<string, string[]> {
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

export function defaultChallengeDigestValidator(): ChallengeDigestValidator {
  return new ChallengeDigestValidator(
    [
      new ChallengeDigestCodePrefixRule("X"),
      new ChallengeDigestScoreRangeRule(2.2, 3875.2),
      new ChallengeDigestLabelLengthRule(32),
      new ChallengeDigestArchivedGuardRule(3600),
      new ChallengeDigestRequiredLabelRule("challenge digest needs this field"),
    ],
  );
}
