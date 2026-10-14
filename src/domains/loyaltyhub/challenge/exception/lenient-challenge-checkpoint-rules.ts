import { LenientChallengeCheckpoint } from "./lenient-challenge-checkpoint.js";

/** A rule a lenient challenge checkpoint must pass. Check returns its problems, or none. */
export interface LenientChallengeCheckpointRule {
  check(item: LenientChallengeCheckpoint): string[];
}

export class LenientChallengeCheckpointCodePrefixRule implements LenientChallengeCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientChallengeCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientChallengeCheckpointTagsLimitRule implements LenientChallengeCheckpointRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LenientChallengeCheckpoint): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class LenientChallengeCheckpointMaximumRangeRule implements LenientChallengeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientChallengeCheckpoint): string[] {
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

/** Runs every rule of a lenient challenge checkpoint. */
export class LenientChallengeCheckpointValidator {
  rules: LenientChallengeCheckpointRule[];

  constructor(rules: LenientChallengeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LenientChallengeCheckpoint): string[] {
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

  requireValid(item: LenientChallengeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientChallengeCheckpoint[]): Map<string, string[]> {
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

export function defaultLenientChallengeCheckpointValidator(): LenientChallengeCheckpointValidator {
  return new LenientChallengeCheckpointValidator(
    [
      new LenientChallengeCheckpointCodePrefixRule("Q"),
      new LenientChallengeCheckpointTagsLimitRule(80, []),
      new LenientChallengeCheckpointMaximumRangeRule(2.6, 1815.7),
    ],
  );
}
